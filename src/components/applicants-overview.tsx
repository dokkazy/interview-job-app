"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Application, User, Job } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ApplicantCard } from "@/components/card/applicant-card";
import { Users } from "lucide-react";
import { createOrGetChatChannel } from "@/lib/stream";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ApplicantsOverviewProps {
  recruiterId: string;
}

export function ApplicantsOverview({ recruiterId }: ApplicantsOverviewProps) {
  const [applications, setApplications] = useState<
    (Application & { applicant: User; job: Job })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchRecentApplicants() {
      try {
        if (!recruiterId) {
          setLoading(false);
          return;
        }

        // Get recent applications for recruiter's jobs - simplified query
        const applicationsQuery = query(
          collection(db, "applications"),
          where("recruiterId", "==", recruiterId),
          limit(5)
        );

        const applicationsSnapshot = await getDocs(applicationsQuery);
        const applicationsData: Application[] = [];

        applicationsSnapshot.forEach((doc) => {
          applicationsData.push({
            id: doc.id,
            ...doc.data(),
          } as Application);
        });

        // Sort applications by date in JavaScript
        const sortedApplications = applicationsData.sort((a, b) => {
          function getDate(val: unknown): Date {
            // Firestore Timestamp has toDate(), otherwise it's a Date
            if (
              val &&
              typeof val === "object" &&
              "toDate" in val &&
              typeof (val as { toDate: unknown }).toDate === "function"
            ) {
              return (val as { toDate: () => Date }).toDate();
            } else if (val instanceof Date) {
              return val;
            } else if (
              val &&
              typeof val === "object" &&
              "seconds" in val &&
              typeof (val as { seconds: unknown }).seconds === "number"
            ) {
              return new Date((val as { seconds: number }).seconds * 1000);
            } else {
              return new Date();
            }
          }
          const dateA = getDate(a.appliedAt);
          const dateB = getDate(b.appliedAt);
          return dateB.getTime() - dateA.getTime();
        });

        // Get applicant and job details for each application
        const applicationsWithDetails = await Promise.all(
          sortedApplications.map(async (application) => {
            try {
              // Get applicant details
              const applicantDoc = await getDoc(
                doc(db, "users", application.applicantId)
              );

              // Get job details
              const jobDoc = await getDoc(doc(db, "jobs", application.jobId));

              if (!applicantDoc.exists() || !jobDoc.exists()) {
                throw new Error("Applicant or job not found");
              }

              return {
                ...application,
                applicant: {
                  id: applicantDoc.id,
                  ...applicantDoc.data(),
                } as User,
                job: {
                  id: jobDoc.id,
                  ...jobDoc.data(),
                } as Job,
              };
            } catch (error) {
              console.error(
                `Error fetching details for application ${application.id}:`,
                error
              );
              // Return a placeholder if there's an error
              return {
                ...application,
                applicant: {
                  id: application.applicantId,
                  displayName: "Unknown Applicant",
                  email: "",
                  photoURL: "",
                  role: "job-seeker",
                  createdAt: new Date(),
                } as User,
                job: {
                  id: application.jobId,
                  title: "Unknown Job",
                  companyName: "Unknown",
                  location: "Unknown",
                  locationType: "remote",
                  description: "",
                  employmentType: "full-time",
                  skills: [],
                  recruiterId: recruiterId,
                  postedAt: new Date(),
                  status: "active",
                } as Job,
              };
            }
          })
        );

        setApplications(applicationsWithDetails);
      } catch (error) {
        console.error("Error fetching recent applicants:", error);
        toast.error("Error loading applicants. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchRecentApplicants();
  }, [recruiterId]);

  const handleUpdateStatus = async (applicationId: string, status: string) => {
    try {
      // Update application status in Firestore
      await updateDoc(doc(db, "applications", applicationId), {
        status,
        updatedAt: new Date(),
      });

      // Update local state
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: status as Application["status"] } : app
        )
      );

      toast.success(`Application status changed to ${status}`);
    } catch (error) {
      console.error("Error updating application:", error);
      toast.error(
        "There was a problem updating the application. Please try again later."
      );
    }
  };

  const handleContactApplicant = async (applicantId: string) => {
    try {
      // Create chat channel
      await createOrGetChatChannel(applicantId, recruiterId);

      // Redirect to messages
      router.push("/messages");
    } catch (error) {
      console.error("Error creating chat:", error);
      toast.error("Error creating chat. Please try again later.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Applicants</CardTitle>
        <CardDescription>
          Review and manage recent job applications
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((application) => (
              <div key={application.id}>
                <div className="mb-2 text-sm font-medium">
                  Applied for: {application.job.title}
                </div>
                <ApplicantCard
                  application={application}
                  onUpdateStatus={handleUpdateStatus}
                  onContact={handleContactApplicant}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-medium mb-2">No applicants yet</h3>
            <p className="text-muted-foreground">
              When job seekers apply to your jobs, they&apos;ll appear here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
