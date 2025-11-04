"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Calendar,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  Building2,
  ArrowRight,
  ArrowLeft
} from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { 
  fetchHealthRecords, 
  validateAbhaId, 
  formatAbhaId,
  type HealthRecordData 
} from "@/lib/abha-service"
import { 
  uploadToIPFS, 
  getIPFSUrl,
  type UploadProgress 
} from "@/lib/ipfs-service"
import { 
  analyzeClaimWithOracle,
  getClaimStatusFromScore,
  formatScoreDisplay,
  type OracleRequest,
  type OracleResponse,
  type OracleProgress 
} from "@/lib/oracle-service"

type Step = 1 | 2 | 3 | 4;

interface ClaimFormData {
  // Step 1: ABHA Data
  abhaId: string;
  patientData: HealthRecordData | null;
  
  // Step 2: Claim Details
  claimAmount: string;
  claimDetails: string;
  incidentDate: Date | undefined;
  treatmentDetails: string;
  hospitalName: string;
  
  // Step 3: Bill Upload
  billFile: File | null;
  ipfsCid: string;
  
  // Step 4: Oracle Analysis
  oracleResponse: OracleResponse | null;
}

export function MultiStepClaimForm() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<ClaimFormData>({
    abhaId: '',
    patientData: null,
    claimAmount: '',
    claimDetails: '',
    incidentDate: undefined,
    treatmentDetails: '',
    hospitalName: '',
    billFile: null,
    ipfsCid: '',
    oracleResponse: null,
  });

  // Loading states
  const [fetchingAbha, setFetchingAbha] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [analyzingClaim, setAnalyzingClaim] = useState(false);
  
  // Progress tracking
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [oracleProgress, setOracleProgress] = useState<OracleProgress | null>(null);
  
  // Error handling
  const [error, setError] = useState<string>('');

  // Step 1: Fetch ABHA Data
  const handleFetchAbhaData = async () => {
    setError('');
    
    if (!validateAbhaId(formData.abhaId)) {
      setError('Invalid ABHA ID. Please enter a 12-digit ABHA ID.');
      return;
    }

    setFetchingAbha(true);
    
    try {
      const response = await fetchHealthRecords(formData.abhaId);
      setFormData(prev => ({
        ...prev,
        patientData: response.data
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health records');
    } finally {
      setFetchingAbha(false);
    }
  };

  // Step 2: Validate claim details
  const validateClaimDetails = (): boolean => {
    if (!formData.claimAmount || parseFloat(formData.claimAmount) <= 0) {
      setError('Please enter a valid claim amount');
      return false;
    }
    if (!formData.claimDetails.trim()) {
      setError('Please provide claim details');
      return false;
    }
    if (!formData.incidentDate) {
      setError('Please select the incident date');
      return false;
    }
    if (!formData.treatmentDetails.trim()) {
      setError('Please provide treatment details');
      return false;
    }
    if (!formData.hospitalName.trim()) {
      setError('Please provide hospital name');
      return false;
    }
    return true;
  };

  // Step 3: Upload bill to IPFS
  const handleFileUpload = async (file: File) => {
    setError('');
    setUploadingFile(true);
    setUploadProgress(null);

    try {
      const result = await uploadToIPFS(file, (progress) => {
        setUploadProgress(progress);
      });

      setFormData(prev => ({
        ...prev,
        billFile: file,
        ipfsCid: result.IpfsHash
      }));

      setUploadProgress({
        progress: 100,
        stage: 'complete',
        message: 'Upload complete!'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      setUploadProgress(null);
    } finally {
      setUploadingFile(false);
    }
  };

  // Step 4: Analyze with Oracle and Submit
  const handleOracleAnalysis = async () => {
    setError('');
    setAnalyzingClaim(true);
    setOracleProgress(null);

    try {
      const oracleRequest: OracleRequest = {
        abhaId: formData.abhaId,
        ipfsCid: formData.ipfsCid,
        claimAmount: parseFloat(formData.claimAmount),
        claimDetails: formData.claimDetails
      };

      const response = await analyzeClaimWithOracle(oracleRequest, (progress) => {
        setOracleProgress(progress);
      });

      setFormData(prev => ({
        ...prev,
        oracleResponse: response
      }));

      setCurrentStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Oracle analysis failed');
    } finally {
      setAnalyzingClaim(false);
    }
  };

  // Navigation
  const handleNext = () => {
    setError('');
    
    if (currentStep === 1) {
      if (!formData.patientData) {
        setError('Please fetch patient data first');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateClaimDetails()) {
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      if (!formData.ipfsCid) {
        setError('Please upload hospital bill first');
        return;
      }
      handleOracleAnalysis();
    }
  };

  const handleBack = () => {
    setError('');
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const getStepProgress = () => {
    return (currentStep / 4) * 100;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">File Insurance Claim</CardTitle>
        <CardDescription>
          Complete all steps to submit your claim for AI-powered analysis
        </CardDescription>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Step {currentStep} of 4</span>
            <span className="text-sm text-muted-foreground">{Math.round(getStepProgress())}% Complete</span>
          </div>
          <Progress value={getStepProgress()} className="w-full" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mt-4">
          {[
            { num: 1, label: 'ABHA Data' },
            { num: 2, label: 'Claim Details' },
            { num: 3, label: 'Upload Bill' },
            { num: 4, label: 'Analysis' },
          ].map((step) => (
            <div key={step.num} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= step.num
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {currentStep > step.num ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  step.num
                )}
              </div>
              <span className="text-xs mt-1 text-muted-foreground">{step.label}</span>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Step 1: ABHA Data */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="abhaId">ABHA ID (Aadhaar-based Health ID)</Label>
                <div className="flex gap-2">
                  <Input
                    id="abhaId"
                    placeholder="Enter 12-digit ABHA ID (e.g., 123456789012)"
                    value={formData.abhaId}
                    onChange={(e) => setFormData(prev => ({ ...prev, abhaId: e.target.value }))}
                    maxLength={14}
                    disabled={fetchingAbha}
                  />
                  <Button
                    onClick={handleFetchAbhaData}
                    disabled={fetchingAbha || !formData.abhaId}
                  >
                    {fetchingAbha ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      'Fetch Data'
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Available test IDs: 123456789012, 234567890123
                </p>
              </div>

              {/* Patient Data Display */}
              {formData.patientData && (
                <div className="bg-muted p-6 rounded-lg space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <h3 className="font-semibold">Patient Information Retrieved</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Name</Label>
                      <p className="font-medium">{formData.patientData.patient_info.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Age / Gender</Label>
                      <p className="font-medium">
                        {formData.patientData.patient_info.age} years / {formData.patientData.patient_info.gender}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Blood Group</Label>
                      <p className="font-medium">{formData.patientData.patient_info.blood_group}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Occupation</Label>
                      <p className="font-medium">{formData.patientData.patient_info.occupation}</p>
                    </div>
                  </div>

                  {/* Recent Visit */}
                  {formData.patientData.recent_visits.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <Label className="text-muted-foreground">Most Recent Visit</Label>
                      <div className="mt-2 space-y-2">
                        <p className="text-sm">
                          <strong>Date:</strong> {formData.patientData.recent_visits[0].date}
                        </p>
                        <p className="text-sm">
                          <strong>Hospital:</strong> {formData.patientData.recent_visits[0].hospital}
                        </p>
                        <p className="text-sm">
                          <strong>Diagnosis:</strong> {formData.patientData.recent_visits[0].diagnosis}
                        </p>
                        <p className="text-sm">
                          <strong>Doctor:</strong> {formData.patientData.recent_visits[0].doctor}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Medical History */}
                  {formData.patientData.medical_history.chronic_conditions.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <Label className="text-muted-foreground">Chronic Conditions</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.patientData.medical_history.chronic_conditions.map((condition, idx) => (
                          <Badge key={idx} variant="secondary">{condition}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Claim Details */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="claimAmount">Claim Amount (₹)</Label>
              <Input
                id="claimAmount"
                type="number"
                placeholder="Enter claim amount"
                value={formData.claimAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, claimAmount: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="claimDetails">Claim Details</Label>
              <Textarea
                id="claimDetails"
                placeholder="Describe the nature of your claim..."
                value={formData.claimDetails}
                onChange={(e) => setFormData(prev => ({ ...prev, claimDetails: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Incident Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.incidentDate ? format(formData.incidentDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={formData.incidentDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, incidentDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatmentDetails">Treatment Details</Label>
              <Textarea
                id="treatmentDetails"
                placeholder="Describe the treatment received..."
                value={formData.treatmentDetails}
                onChange={(e) => setFormData(prev => ({ ...prev, treatmentDetails: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hospitalName">Hospital Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="hospitalName"
                  placeholder="Enter hospital name"
                  className="pl-10"
                  value={formData.hospitalName}
                  onChange={(e) => setFormData(prev => ({ ...prev, hospitalName: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Upload Bill */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Hospital Bill (PDF Only)</Label>
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => document.getElementById('billUpload')?.click()}
              >
                <input
                  id="billUpload"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file);
                    }
                  }}
                  disabled={uploadingFile}
                />
                
                {!formData.billFile ? (
                  <>
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload hospital bill</p>
                    <p className="text-xs text-muted-foreground mt-2">PDF only, max 10MB</p>
                  </>
                ) : (
                  <>
                    <FileText className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    <p className="text-sm font-medium">{formData.billFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {(formData.billFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {formData.ipfsCid && (
                      <div className="mt-4 p-4 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">IPFS CID:</p>
                        <p className="text-sm font-mono break-all">{formData.ipfsCid}</p>
                        <a
                          href={getIPFSUrl(formData.ipfsCid)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline mt-2 inline-block"
                        >
                          View on IPFS
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Upload Progress */}
              {uploadProgress && (
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{uploadProgress.message}</span>
                    <span className="text-sm text-muted-foreground">{uploadProgress.progress}%</span>
                  </div>
                  <Progress value={uploadProgress.progress} />
                  <div className="flex items-center gap-2">
                    {uploadProgress.stage === 'complete' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    )}
                    <span className="text-xs text-muted-foreground capitalize">{uploadProgress.stage}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Oracle Preview */}
            {formData.ipfsCid && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                  Ready for Oracle Analysis
                </h4>
                <p className="text-sm text-muted-foreground">
                  Your data is ready to be analyzed by our AI-powered Chainlink Oracle DON.
                  Click "Continue" to proceed with the analysis.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Oracle Analysis Result */}
        {currentStep === 4 && formData.oracleResponse && (
          <div className="space-y-6">
            {/* Score Display */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-6 rounded-lg border">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">AI Analysis Complete</h3>
                <div className="text-5xl font-bold mb-2">
                  {formData.oracleResponse.score}
                  <span className="text-2xl text-muted-foreground">/100</span>
                </div>
                <Badge
                  className="mt-2"
                  variant={
                    formData.oracleResponse.score <= 30
                      ? 'default'
                      : formData.oracleResponse.score <= 70
                      ? 'secondary'
                      : 'destructive'
                  }
                >
                  {formatScoreDisplay(formData.oracleResponse.score).label}
                </Badge>
                <p className="text-sm text-muted-foreground mt-4">
                  Request ID: {formData.oracleResponse.requestId}
                </p>
              </div>
            </div>

            {/* Validations */}
            {formData.oracleResponse.validations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Validations Passed
                </h4>
                <ul className="space-y-2">
                  {formData.oracleResponse.validations.map((validation, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-green-500 flex-shrink-0">✓</span>
                      <span>{validation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Red Flags */}
            {formData.oracleResponse.redFlags.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  Red Flags Detected
                </h4>
                <ul className="space-y-2">
                  {formData.oracleResponse.redFlags.map((flag, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2 text-orange-600 dark:text-orange-400">
                      <span className="flex-shrink-0">⚠️</span>
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {formData.oracleResponse.suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Suggestions
                </h4>
                <ul className="space-y-2">
                  {formData.oracleResponse.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="flex-shrink-0">📋</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Claim Status */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Claim Status</h4>
              <p className="text-sm">
                {getClaimStatusFromScore(formData.oracleResponse.score).message}
              </p>
            </div>

            {/* Submit to Blockchain Button */}
            <Button className="w-full" size="lg">
              Submit to Blockchain
            </Button>
          </div>
        )}

        {/* Oracle Progress (shown during analysis) */}
        {analyzingClaim && oracleProgress && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Processing Claim</h3>
                    <p className="text-sm text-muted-foreground">{oracleProgress.message}</p>
                  </div>
                  <Progress value={oracleProgress.progress} className="w-full" />
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm capitalize">{oracleProgress.stage}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep < 4 && (
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || fetchingAbha || uploadingFile}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={
                fetchingAbha ||
                uploadingFile ||
                analyzingClaim ||
                (currentStep === 1 && !formData.patientData) ||
                (currentStep === 3 && !formData.ipfsCid)
              }
            >
              {currentStep === 3 ? 'Analyze Claim' : 'Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

