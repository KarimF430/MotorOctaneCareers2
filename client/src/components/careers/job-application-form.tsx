import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type JobOpening } from "@/data/jobs";
import { ArrowLeft, ArrowRight } from "lucide-react";

// Step 1: Basic Information Schema
const basicInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  cv: z.instanceof(File).optional(),
  canTravelToNaviMumbai: z.enum(["yes", "no"], { required_error: "Please select an option" }),
  currentSalary: z.string().optional(),
  expectedSalary: z.string().optional(),
  whyMotorOctane: z.string().min(10, "Please provide a detailed response (minimum 10 characters)"),
});

// Step 2: Job-Specific Questions Schema (dynamic based on job)
const jobSpecificSchema = z.object({
  questions: z.record(z.string().optional())
});

type BasicInfoData = z.infer<typeof basicInfoSchema>;
type JobSpecificData = z.infer<typeof jobSpecificSchema>;

// Enhanced question structure for different form types
interface QuestionConfig {
  question: string;
  type: 'text' | 'checkbox' | 'radio' | 'rating' | 'textarea';
  options?: string[];
  scale?: { min: number; max: number; labels?: { min: string; max: string } };
}

// Job-specific questions configuration
const getJobSpecificQuestions = (job: JobOpening): QuestionConfig[] => {
  const department = job.department?.toLowerCase() || '';
  const jobType = job.type?.toLowerCase() || '';
  const title = job.title?.toLowerCase() || '';

  // Special handling for Videographer and Editor positions
  if (title.includes('videographer') || title.includes('video editor') || 
      title.includes('video') || title.includes('editor')) {
    return [
      {
        question: "Proficiency at handling DSLR Gimbal:",
        type: 'radio',
        options: ['Professional', 'Limited Experience', 'No Experience']
      },
      {
        question: "Rate yourself on your skill to setup and operate a DSLR Gimbal",
        type: 'rating',
        scale: { min: 1, max: 10 }
      },
      {
        question: "What are the various stages in shooting a product before it goes for grading? Explain briefly.",
        type: 'textarea'
      },
      {
        question: "Please share your work links for reference",
        type: 'textarea'
      },
      {
        question: "Can you edit videos?",
        type: 'radio',
        options: ['Yes', 'No']
      },
      {
        question: "Which software's can you edit on? Mention below",
        type: 'radio',
        options: ['FCP X', 'Premiere Pro', 'FCP 7', 'Premiere Rush']
      },
      {
        question: "How well can you colour grade on a scale of 1-10?",
        type: 'rating',
        scale: { min: 1, max: 10, labels: { min: 'Worst', max: 'Best' } }
      },
      {
        question: "How well can you balance music on a scale of 1-10?",
        type: 'rating',
        scale: { min: 1, max: 10 }
      },
      {
        question: "How well can you select music for a video on a scale of 1-10?",
        type: 'rating',
        scale: { min: 1, max: 10 }
      },
      {
        question: "Can you animate as well?",
        type: 'radio',
        options: ['Yes', 'No']
      }
    ];
  }

  // Special handling for Content Writer positions
  if (title.includes('content writer') || title.includes('writer') || 
      (title.includes('content') && title.includes('writer'))) {
    return [
      {
        question: "What do you enjoy the most about content writing?",
        type: 'text'
      },
      {
        question: "What all kind of content have you written before?",
        type: 'textarea'
      },
      {
        question: "How do you integrate SEO into your content?",
        type: 'textarea'
      }
    ];
  }

  // Special handling for Social Media and Content Creation positions
  if (title.includes('social media') || title.includes('content creation') || 
      title.includes('social') || title.includes('content')) {
    return [
      {
        question: "Will you be open to work as an intern if you don't have any experience?",
        type: 'radio',
        options: ['Yes', 'No']
      },
      {
        question: "Have you done any courses on social media with certification?",
        type: 'radio',
        options: ['Yes', 'No', 'Maybe']
      },
      {
        question: "Can you edit photos and videos on a phone?",
        type: 'checkbox',
        options: ['Yes', 'No']
      },
      {
        question: "How well do you understand Facebook & Instagram when it comes to business tools?",
        type: 'rating',
        scale: { min: 1, max: 10 }
      },
      {
        question: "How many years of relevant experience do you have in Social Media?",
        type: 'rating',
        scale: { min: 1, max: 10 }
      }
    ];
  }

  // Special handling for Media Sales position
  if (title.includes('media sales') || title.toLowerCase().includes('sales')) {
    return [
      {
        question: "Which companies have you worked before?",
        type: 'textarea'
      },
      {
        question: "Have you built concepts for automotive products?",
        type: 'radio',
        options: ['Yes', 'No']
      },
      {
        question: "Which all car or related brands are your clientele?",
        type: 'textarea'
      },
      {
        question: "What is your understanding about digital and videos on a scale of 1-5?",
        type: 'rating',
        scale: { min: 1, max: 5 }
      }
    ];
  }

  // For internships, specific questions about studies and commitment
  if (jobType.includes('internship') || title.includes('internship')) {
    return [
      { question: "Are you currently studying?", type: 'text' },
      { question: "Can you dedicate 6 months for full time work?", type: 'text' },
      { question: "We can offer Rs 8000 stipend per month - if ok then we proceed with your application", type: 'text' }
    ];
  }

  const commonQuestions: QuestionConfig[] = [
    { question: "What interests you most about working in the automotive industry?", type: 'textarea' },
    { question: "How do you stay updated with the latest automotive trends and technologies?", type: 'textarea' }
  ];

  const departmentQuestions: Record<string, QuestionConfig[]> = {
    production: [
      ...commonQuestions,
      { question: "What video production tools and software are you proficient in?", type: 'textarea' },
      { question: "Describe your experience with automotive video content creation.", type: 'textarea' },
      { question: "How would you handle filming in challenging automotive environments?", type: 'textarea' }
    ],
    consultancy: [
      ...commonQuestions,
      { question: "What's your experience with automotive consulting or advisory services?", type: 'textarea' },
      { question: "How do you approach client relationship management?", type: 'textarea' },
      { question: "Share an example of a complex automotive problem you've solved.", type: 'textarea' }
    ],
    backend: [
      ...commonQuestions,
      { question: "What programming languages and frameworks do you specialize in?", type: 'textarea' },
      { question: "How would you design a system to handle high-traffic automotive content?", type: 'textarea' },
      { question: "Describe your experience with database optimization for media-heavy applications.", type: 'textarea' }
    ],
    content: [
      ...commonQuestions,
      { question: "What's your writing style when it comes to automotive content?", type: 'textarea' },
      { question: "How do you research and fact-check automotive information?", type: 'textarea' },
      { question: "Share examples of automotive content you've created that performed well.", type: 'textarea' }
    ],
    marketing: [
      ...commonQuestions,
      { question: "How would you market MotorOctane to reach more car enthusiasts?", type: 'textarea' },
      { question: "What social media strategies work best for automotive content?", type: 'textarea' },
      { question: "Describe a successful automotive marketing campaign you admire.", type: 'textarea' }
    ]
  };

  return departmentQuestions[department] || commonQuestions;
};

interface JobApplicationFormProps {
  job: JobOpening;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function JobApplicationForm({ job, open, onOpenChange }: JobApplicationFormProps) {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [basicInfo, setBasicInfo] = useState<BasicInfoData | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isInternship = job.type?.toLowerCase().includes('internship') || 
                      job.title?.toLowerCase().includes('internship');
  const jobSpecificQuestions: QuestionConfig[] = getJobSpecificQuestions(job);
  const isStepRequired = jobSpecificQuestions.length > 0;

  // Form for Step 1 (Basic Info)
  const basicForm = useForm<BasicInfoData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      canTravelToNaviMumbai: undefined,
      currentSalary: "",
      expectedSalary: "",
      whyMotorOctane: "",
    },
  });

  // Form for Step 2 (Job-specific questions)
  const jobSpecificForm = useForm<JobSpecificData>({
    resolver: zodResolver(jobSpecificSchema),
    defaultValues: {
      questions: jobSpecificQuestions.reduce((acc, question) => {
        acc[question.question] = '';
        return acc;
      }, {} as Record<string, string>),
    },
  });

  const submitApplication = useMutation({
    mutationFn: async ({ basicData, jobSpecificData }: { basicData: BasicInfoData, jobSpecificData?: JobSpecificData }) => {
      const formData = new FormData();
      formData.append('jobId', job.id);
      formData.append('firstName', basicData.firstName);
      formData.append('lastName', basicData.lastName);
      formData.append('email', basicData.email);
      formData.append('phone', basicData.phone);
      
      if (cvFile) {
        formData.append('cv', cvFile);
      }
      formData.append('canTravelToNaviMumbai', basicData.canTravelToNaviMumbai);
      if (basicData.currentSalary) formData.append('currentSalary', basicData.currentSalary);
      if (basicData.expectedSalary) formData.append('expectedSalary', basicData.expectedSalary);
      formData.append('whyMotorOctane', basicData.whyMotorOctane);

      // Add job-specific answers if available
      if (jobSpecificData) {
        formData.append('jobSpecificAnswers', JSON.stringify(jobSpecificData.questions));
      }

      // Debug: log FormData keys and values (file names only, not content)
      const debugEntries: Array<[string, string]> = [];
      formData.forEach((value, key) => {
        const desc = value instanceof File ? `File:${value.name}` : String(value);
        debugEntries.push([key, desc]);
      });
      console.log('Submitting /api/applications with FormData:', debugEntries);

      const response = await fetch('/api/applications', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        let details = text;
        try {
          const json = JSON.parse(text);
          details = json.details || json.error || text;
        } catch {}
        console.error('Application submit failed:', response.status, details);
        throw new Error(`Failed to submit application (HTTP ${response.status}). ${details}`);
      }

      const result = await response.json().catch(async () => {
        const text = await response.text();
        throw new Error(`Failed to parse server response JSON. Raw: ${text}`);
      });
      console.log('Application submit success:', result);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your application has been successfully submitted. We'll be in touch soon!",
      });
      resetForms();
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit application. Please try again.",
        variant: "destructive",
      });
      console.error('Application submission error:', error);
    },
  });

  // Step 1 submission (Basic Info)
  const onBasicInfoSubmit = (data: BasicInfoData) => {
    setBasicInfo(data);
    if (!isStepRequired) {
      // For jobs without additional questions, submit directly
      submitApplication.mutate({ basicData: data });
    } else {
      // Move to step 2 for jobs with questions (including internships)
      setCurrentStep(2);
    }
  };

  // Step 2 submission (Job-specific questions)
  const onJobSpecificSubmit = (data: JobSpecificData) => {
    console.log('Step 2 form submission triggered');
    console.log('Form data:', data);
    console.log('Basic info available:', basicInfo);
    
    // Check if basic info is missing and navigate back
    if (!basicInfo) {
      console.error('Basic info is missing - navigating back to step 1');
      toast({
        title: "Missing Information",
        description: "Please complete step 1 first.",
        variant: "destructive",
      });
      setCurrentStep(1);
      return;
    }

    console.log('Submitting application with both basic and job-specific data');
    submitApplication.mutate({ basicData: basicInfo, jobSpecificData: data });
  };

  // Reset all forms and state
  const resetForms = () => {
    basicForm.reset();
    jobSpecificForm.reset();
    setCvFile(null);
    setCurrentStep(1);
    setBasicInfo(null);
  };

  // Go back to step 1
  const goBack = () => {
    setCurrentStep(1);
  };

  const handleFileUpload = (file: File | undefined) => {
    if (file) {
      setCvFile(file);
    }
  };

  useEffect(() => {
    if (open) {
      // Use setTimeout to ensure the dialog is fully rendered
      setTimeout(() => {
        // Try multiple selectors to find the scrollable content
        const scrollableElement = document.querySelector('.overflow-y-auto') ||
                                 document.querySelector('[data-radix-dialog-content] .overflow-y-auto') ||
                                 document.querySelector('.DialogContent .overflow-y-auto') ||
                                 document.querySelector('[role="dialog"] .overflow-y-auto');
        
        if (scrollableElement) {
          scrollableElement.scrollTop = 0;
        }
      }, 150);
    }
  }, [open]);

  // Render Step 1 - Basic Information
  const renderStep1 = () => (
    <Form {...basicForm}>
      <form onSubmit={basicForm.handleSubmit(onBasicInfoSubmit)} className="flex flex-col h-full min-h-0">
        <div className="flex-1 space-y-4 sm:space-y-6 pb-2 sm:pb-4 overflow-y-auto">
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Personal Information</h3>
            <p className="text-xs text-gray-600">Please provide your basic details</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={basicForm.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">
                    First Name *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your first name"
                      {...field}
                      data-testid="input-firstName"
                      className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={basicForm.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">
                    Last Name *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your last name"
                      {...field}
                      data-testid="input-lastName"
                      className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={basicForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">
                    Email Address *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="your.email@example.com"
                      type="email"
                      {...field}
                      data-testid="input-email"
                      className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={basicForm.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">
                    Phone Number *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+91 98765 43210"
                      type="tel"
                      {...field}
                      data-testid="input-phone"
                      className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Professional Information Section - Hidden for Internships */}
          {!isInternship && (
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-2">
                <h3 className="text-lg font-semibold text-gray-900">Professional Information</h3>
                <p className="text-sm text-gray-600">Help us understand your salary expectations (optional)</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={basicForm.control}
                    name="currentSalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">
                          Current/Previous Salary
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="₹5,00,000 per annum"
                            {...field}
                            data-testid="input-currentSalary"
                            className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={basicForm.control}
                    name="expectedSalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">
                          Expected Salary
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="₹6,00,000 per annum"
                            {...field}
                            data-testid="input-expectedSalary"
                            className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Application Materials Section */}
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-2">
                <h3 className="text-lg font-semibold text-gray-900">Application Materials</h3>
                <p className="text-sm text-gray-600">Upload your resume and answer location-related questions</p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Upload Resume/CV</Label>
                  <div className="relative">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileUpload(e.target.files?.[0])}
                      className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                      data-testid="input-cv"
                    />
                    {cvFile && (
                      <p className="text-xs text-green-600 mt-2 flex items-center">
                        <span className="mr-1">✓</span>
                        Selected: {cvFile.name}
                      </p>
                    )}
                  </div>
                </div>

                <FormField
                  control={basicForm.control}
                  name="canTravelToNaviMumbai"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-sm font-medium text-foreground">
                        Are you able to commute to Navi Mumbai daily? *
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex gap-6"
                          data-testid="radio-travel-navi-mumbai"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="travel-yes" className="border-gray-300 text-red-600" />
                            <Label htmlFor="travel-yes" className="text-sm cursor-pointer font-medium">Yes, I can commute</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="travel-no" className="border-gray-300 text-red-600" />
                            <Label htmlFor="travel-no" className="text-sm cursor-pointer font-medium">No, I cannot commute</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Personal Statement Section */}
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-2">
                <h3 className="text-lg font-semibold text-gray-900">Personal Statement</h3>
                <p className="text-sm text-gray-600">Tell us about your motivation and unique value</p>
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Why MotorOctane? How can you contribute to our growth that others cannot? *
                </label>
                <textarea
                  placeholder="Share your passion for automotive content, your unique skills, experience, and how you can help MotorOctane reach new heights..."
                  value={basicForm.watch("whyMotorOctane") || ""}
                  onChange={(e) => basicForm.setValue("whyMotorOctane", e.target.value)}
                  className="w-full min-h-[150px] p-4 border-2 border-gray-400 rounded-md focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none resize-vertical text-base bg-white shadow-sm"
                  rows={6}
                  required
                />
                {basicForm.formState.errors.whyMotorOctane && (
                  <p className="text-sm text-red-600 mt-1">
                    {basicForm.formState.errors.whyMotorOctane.message}
                  </p>
                )}
              </div>
            </div>

        </div>
        
        {/* Submit Button - Fixed at bottom */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 pt-3 sm:pt-4 mt-2 sm:mt-4 sticky bottom-0">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3">
            <p className="text-xs text-gray-500 text-center sm:text-left order-2 sm:order-1">
              * Required fields
            </p>
            <Button
              type="submit"
              disabled={submitApplication.isPending}
              className="bg-red-600 text-white hover:bg-red-700 px-4 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 w-full sm:w-auto order-1 sm:order-2"
              data-testid="button-submit-application-step-1"
            >
              {submitApplication.isPending ? "Submitting..." : 
               isStepRequired ? "Next" : "Submit Application"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );

  // Render Step 2 - Job-specific Questions
  const renderStep2 = () => (
    <Form {...jobSpecificForm}>
      <form onSubmit={jobSpecificForm.handleSubmit(onJobSpecificSubmit)} className="flex flex-col h-full min-h-0">
        <div className="flex-1 space-y-4 sm:space-y-6 pb-2 sm:pb-4 overflow-y-auto">
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Job-Specific Questions</h3>
            <p className="text-xs sm:text-sm text-gray-600">Please answer these questions specific to the {job.title} role</p>
          </div>
          
          <div className="space-y-6">
            {jobSpecificQuestions.map((questionConfig, index) => (
              <FormField
                key={index}
                control={jobSpecificForm.control}
                name={`questions.${questionConfig.question}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      {questionConfig.question} *
                    </FormLabel>
                    <FormControl>
                      <>
                        {questionConfig.type === 'checkbox' && (
                          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200 space-y-2">
                            {questionConfig.options?.map((option, optionIndex) => {
                              const fieldValue = field.value || '';
                              const currentValues = fieldValue ? fieldValue.split(', ').filter(v => v.trim() !== '') : [];
                              const isChecked = currentValues.includes(option);
                              
                              return (
                                <div 
                                  key={optionIndex} 
                                  className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                                    isChecked 
                                      ? 'bg-red-100 border-red-400 shadow-md ring-2 ring-red-200' 
                                      : 'bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm'
                                  }`}
                                  onClick={() => {
                                    const fieldValue = field.value || '';
                                    const currentValues = fieldValue ? fieldValue.split(', ').filter(v => v.trim() !== '') : [];
                                    let newValues;
                                    
                                    if (currentValues.includes(option)) {
                                      newValues = currentValues.filter(v => v !== option);
                                    } else {
                                      newValues = [...currentValues, option];
                                    }
                                    
                                    const newFieldValue = newValues.length > 0 ? newValues.join(', ') : '';
                                    field.onChange(newFieldValue);
                                  }}
                                >
                                  <div className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center transition-all duration-200 ${
                                    isChecked 
                                      ? 'bg-red-600 border-red-600' 
                                      : 'bg-white border-gray-400'
                                  }`}>
                                    {isChecked && (
                                      <span className="text-white text-sm font-bold">✓</span>
                                    )}
                                  </div>
                                  <span className={`text-sm font-medium flex-grow ${isChecked ? 'text-red-800 font-semibold' : 'text-gray-700'}`}>
                                    {option}
                                  </span>
                                  {isChecked && (
                                    <div className="flex-shrink-0">
                                      <div className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                                        ✓ SELECTED
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {questionConfig.type === 'radio' && (
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                            {questionConfig.options?.map((option, optionIndex) => {
                              const isSelected = field.value === option;
                              
                              return (
                                <div 
                                  key={optionIndex}
                                  className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                    isSelected 
                                      ? 'bg-red-100 border-red-400' 
                                      : 'bg-white border-gray-300 hover:border-gray-400'
                                  }`}
                                  onClick={() => field.onChange(option)}
                                >
                                  <div className="flex items-center space-x-3">
                                    <input
                                      type="radio"
                                      name={`question_${index}`}
                                      value={option}
                                      checked={isSelected}
                                      onChange={() => {}} // Handled by div onClick
                                      className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                                    />
                                    <span className={`font-medium ${isSelected ? 'text-red-800' : 'text-gray-700'}`}>
                                      {option}
                                    </span>
                                  </div>
                                  {isSelected && (
                                    <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                                      ✓ SELECTED
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {questionConfig.type === 'rating' && questionConfig.scale && (
                          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
                            <div className="flex justify-between items-center">
                              {questionConfig.scale.labels?.min && (
                                <span className="text-sm text-orange-600 font-semibold">
                                  {questionConfig.scale.labels.min}
                                </span>
                              )}
                              {questionConfig.scale.labels?.max && (
                                <span className="text-sm text-blue-600 font-semibold">
                                  {questionConfig.scale.labels.max}
                                </span>
                              )}
                            </div>
                            <div className="flex justify-between items-center px-2">
                              {Array.from({ length: questionConfig.scale.max - questionConfig.scale.min + 1 }, (_, i) => {
                                const value = questionConfig.scale!.min + i;
                                return (
                                  <div key={value} className="flex flex-col items-center space-y-2">
                                    <span className="text-sm font-semibold text-blue-600">
                                      {value}
                                    </span>
                                    <div
                                      className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-all duration-200 hover:scale-110 ${
                                        field.value === value.toString()
                                          ? 'bg-red-600 border-red-600 shadow-lg'
                                          : 'border-gray-300 hover:border-red-400 bg-white'
                                      }`}
                                      onClick={() => field.onChange(value.toString())}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {(questionConfig.type === 'textarea' || questionConfig.type === 'text') && (
                          <Textarea
                            placeholder={questionConfig.type === 'textarea' ? "Please provide a detailed answer..." : "Your answer..."}
                            {...field}
                            data-testid={`textarea-question-${index}`}
                            className={`${questionConfig.type === 'textarea' ? 'min-h-[70px] sm:min-h-[90px]' : 'min-h-[50px] sm:min-h-[60px]'} resize-none border-gray-300 focus:border-red-500 focus:ring-red-500 bg-gray-50 focus:bg-white transition-colors text-sm sm:text-base`}
                          />
                        )}
                      </>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>
        
        {/* Navigation Buttons - Fixed at bottom */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 pt-3 sm:pt-4 mt-2 sm:mt-4 sticky bottom-0">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full sm:w-auto order-2 sm:order-1 py-2.5 sm:py-3"
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              type="submit"
              disabled={submitApplication.isPending}
              className="bg-red-600 text-white hover:bg-red-700 px-4 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 w-full sm:w-auto order-1 sm:order-2"
              data-testid="button-submit-application-step-2"
            >
              {submitApplication.isPending ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] sm:max-h-[95vh] mx-1 sm:mx-4 md:mx-8 flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex-shrink-0">
          <DialogTitle className="text-base sm:text-lg md:text-xl font-bold text-gray-900 pr-8">
            Apply for {job.title}
            {isStepRequired && (
              <span className="block sm:inline sm:ml-2 text-xs sm:text-sm font-normal text-gray-500 mt-1 sm:mt-0" data-testid="step-indicator">
                Step {currentStep} of 2
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-2 sm:py-4 min-h-0">
          {currentStep === 1 ? renderStep1() : renderStep2()}
        </div>
      </DialogContent>
    </Dialog>
  );
}