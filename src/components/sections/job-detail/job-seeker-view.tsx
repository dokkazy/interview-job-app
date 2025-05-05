"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Job, User, Application } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/loading-spinner";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Building,
  MapPin,
  Clock,
  Briefcase,
  DollarSign,
  FileText,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

interface JobSeekerViewProps {
  job: Job;
  user: User | null;
}

export function JobSeekerView({ job, user }: JobSeekerViewProps) {
  const router = useRouter();

  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(true);
  const [applying, setApplying] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    async function checkIfApplied() {
      if (!user) {
        setCheckingApplication(false);
        return;
      }

      try {
        const applicationsQuery = query(
          collection(db, "applications"),
          where("jobId", "==", job.id),
          where("applicantId", "==", user.id)
        );

        const applicationsSnapshot = await getDocs(applicationsQuery);
        setHasApplied(!applicationsSnapshot.empty);
      } catch (error) {
        console.error("Error checking application status:", error);
      } finally {
        setCheckingApplication(false);
      }
    }

    checkIfApplied();
  }, [job.id, user]);

  const handleApply = async () => {
    if (!user) {
      router.push(`/login?redirect=/jobs/${job.id}`);
      return;
    }

    if (user.role !== "job-seeker") {
      toast.error("Only job seekers can apply for jobs.");
      return;
    }

    setApplying(true);

    try {
      // In a real app, you would upload the resume to storage
      // For this demo, we'll just use a placeholder URL
      const resumeUrl = resumeFile
        ? `https://example.com/resumes/${user.id}/${resumeFile.name}`
        : user.profile?.resumeUrl || "https://example.com/resumes/default.pdf";

      const applicationData: Partial<Application> = {
        jobId: job.id,
        recruiterId: job.recruiterId,
        applicantId: user.id,
        resumeUrl,
        coverLetter: coverLetter.trim() || undefined,
        status: "pending",
        appliedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "applications"), applicationData);

      toast.success("Your application has been submitted successfully.");

      setHasApplied(true);
      setDialogOpen(false);
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error(
        "There was a problem submitting your application. Please try again later."
      );
    } finally {
      setApplying(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main job details */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{job.title}</h1>
              <Badge variant={job.status === "active" ? "default" : "outline"}>
                {job.status === "active" ? "Active" : "Closed"}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-4 text-muted-foreground mb-6">
              <div className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                <span>{job.companyName}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                <span>
                  {job.locationType} · {job.employmentType.replace("-", " ")}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  Posted{" "}
                  {formatDistanceToNow(job.postedAt, { addSuffix: true })}
                </span>
              </div>
            </div>

            {job.salary && (
              <div className="flex items-center gap-2 mb-6">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="font-medium">
                  {job.salary.min.toLocaleString()} -{" "}
                  {job.salary.max.toLocaleString()} {job.salary.currency} per
                  year
                </span>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {job.description.split("\n").map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Skills & Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {job.skills &&
                  job.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Application sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Apply for this position</CardTitle>
              <CardDescription>
                Submit your application to {job.companyName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {checkingApplication ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner />
                </div>
              ) : hasApplied ? (
                <div className="flex flex-col items-center text-center py-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                  <h3 className="text-lg font-medium">Application Submitted</h3>
                  <p className="text-muted-foreground">
                    You have already applied for this position
                  </p>
                </div>
              ) : job.status !== "active" ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    This job is no longer accepting applications
                  </p>
                </div>
              ) : !user ? (
                <div className="space-y-4">
                  <p className="text-center text-muted-foreground">
                    Sign in to apply for this job
                  </p>
                  <Button asChild className="w-full">
                    <Link href={`/login?redirect=/jobs/${job.id}`}>
                      Sign In to Apply
                    </Link>
                  </Button>
                </div>
              ) : user.role !== "job-seeker" ? (
                <p className="text-center text-muted-foreground">
                  Only job seekers can apply for jobs
                </p>
              ) : (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">Apply Now</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Apply for {job.title}</DialogTitle>
                      <DialogDescription>
                        Submit your application to {job.companyName}. Make sure
                        your profile is up to date.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="resume">Resume</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="resume"
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                          />
                          {resumeFile && (
                            <span className="text-sm text-muted-foreground">
                              {resumeFile.name}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {user.profile?.resumeUrl
                            ? "You can upload a new resume or use the one from your profile."
                            : "Upload your resume (PDF, DOC, or DOCX)"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="coverLetter">
                          Cover Letter (Optional)
                        </Label>
                        <Textarea
                          id="coverLetter"
                          placeholder="Tell the employer why you're a good fit for this position..."
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          rows={6}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleApply} disabled={applying}>
                        {applying ? (
                          <>
                            <LoadingSpinner />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <FileText className="mr-2 h-4 w-4" />
                            Submit Application
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">{job.companyName}</h3>
                  <p className="text-muted-foreground">{job.location}</p>
                </div>
                {/* In a real app, you might have more company details here */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
