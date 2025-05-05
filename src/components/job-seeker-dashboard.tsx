"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { User, Application, Job } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { JobApplicationCard } from "@/components/card/job-application-card"
import { RecommendedJobs } from "@/components/recommended-jobs"
import { Button } from "@/components/ui/button"
import { MessageSquare, Calendar, FileText } from "lucide-react"
import Link from "next/link"
import { LoadingSpinner } from "@/components/loading-spinner"
import { toast } from "sonner"

interface JobSeekerDashboardProps {
  user: User
}

export function JobSeekerDashboard({ user }: JobSeekerDashboardProps) {
  const [applications, setApplications] = useState<(Application & { job: Job })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchApplications() {
      try {
        if (!user || !user.id) {
          setLoading(false)
          return
        }

        // Get user's applications - simplified query
        const applicationsQuery = query(collection(db, "applications"), where("applicantId", "==", user.id))

        const applicationsSnapshot = await getDocs(applicationsQuery)
        const applicationsData: Application[] = []

        applicationsSnapshot.forEach((doc) => {
          applicationsData.push({
            id: doc.id,
            ...doc.data(),
          } as Application)
        })

        // Sort applications by date in JavaScript
        const sortedApplications = applicationsData.sort((a, b) => {
          function getDate(val: unknown): Date {
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

        // Get job details for each application
        const applicationsWithJobs = await Promise.all(
          sortedApplications.map(async (application) => {
            try {
              // Get job document directly by ID instead of using a query
              const jobDoc = await getDoc(doc(db, "jobs", application.jobId))

              if (!jobDoc.exists()) {
                return {
                  ...application,
                  job: {
                    id: application.jobId,
                    title: "Job no longer available",
                    companyName: "Unknown",
                    location: "Unknown",
                    locationType: "remote",
                    description: "",
                    employmentType: "full-time",
                    skills: [],
                    recruiterId: "",
                    postedAt: new Date(),
                    status: "closed",
                  } as Job,
                }
              }

              return {
                ...application,
                job: {
                  id: jobDoc.id,
                  ...jobDoc.data(),
                } as Job,
              }
            } catch (error) {
              console.error(`Error fetching job for application ${application.id}:`, error)
              // Return a placeholder job if there's an error
              return {
                ...application,
                job: {
                  id: application.jobId,
                  title: "Error loading job",
                  companyName: "Unknown",
                  location: "Unknown",
                  locationType: "remote",
                  description: "",
                  employmentType: "full-time",
                  skills: [],
                  recruiterId: "",
                  postedAt: new Date(),
                  status: "closed",
                } as Job,
              }
            }
          }),
        )

        setApplications(applicationsWithJobs)
      } catch (error) {
        console.error("Error fetching applications:", error)
        toast.error("There was a problem loading your applications. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [user])

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user.displayName}</h1>
          <p className="text-muted-foreground">Manage your job applications and discover new opportunities</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/profile">
              <FileText className="mr-2 h-4 w-4" />
              My Profile
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/messages">
              <MessageSquare className="mr-2 h-4 w-4" />
              Messages
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/interviews">
              <Calendar className="mr-2 h-4 w-4" />
              Interviews
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="applications">
        <TabsList>
          <TabsTrigger value="applications">My Applications</TabsTrigger>
          <TabsTrigger value="recommended">Recommended Jobs</TabsTrigger>
        </TabsList>
        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Job Applications</CardTitle>
              <CardDescription>Track the status of your job applications</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <JobApplicationCard key={application.id} application={application} job={application.job} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">You haven&apos;t applied to any jobs yet</p>
                  <Button asChild>
                    <Link href="/jobs">Browse Jobs</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="recommended">
          <RecommendedJobs userId={user.id} interests={user.interests || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
