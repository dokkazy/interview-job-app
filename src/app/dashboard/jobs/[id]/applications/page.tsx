"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Job, Application, User as UserType } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ArrowLeft, Users } from "lucide-react"
import Link from "next/link"
import { ApplicantCard } from "@/components/card/applicant-card"
import { createOrGetChatChannel } from "@/lib/stream"
import { toast } from "sonner"

export default function JobApplicationsPage() {
  const { id } = useParams()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [job, setJob] = useState<Job | null>(null)
  const [applications, setApplications] = useState<(Application & { applicant: UserType })[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    } else if (!authLoading && user && user.role !== "recruiter") {
      router.push("/dashboard")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    async function fetchJobAndApplications() {
      if (!user) return

      try {
        // Get job details
        const jobDoc = await getDoc(doc(db, "jobs", id as string))

        if (!jobDoc.exists()) {
          toast.warning("The job you're looking for doesn't exist")
          router.push("/dashboard")
          return
        }

        const jobData = {
          id: jobDoc.id,
          ...jobDoc.data(),
        } as Job

        // Check if user is the recruiter who posted this job
        if (jobData.recruiterId !== user.id) {
          toast.error("You don't have permission to view these applications")
          router.push("/dashboard")
          return
        }

        setJob(jobData)

        // Get applications for this job
        const applicationsQuery = query(collection(db, "applications"), where("jobId", "==", id))

        const applicationsSnapshot = await getDocs(applicationsQuery)
        const applicationsData: Application[] = []

        applicationsSnapshot.forEach((doc) => {
          applicationsData.push({
            id: doc.id,
            ...doc.data(),
          } as Application)
        })

        // Get applicant details for each application
        const applicationsWithApplicants = await Promise.all(
          applicationsData.map(async (application) => {
            const applicantDoc = await getDoc(doc(db, "users", application.applicantId))

            return {
              ...application,
              applicant: {
                id: applicantDoc.id,
                ...applicantDoc.data(),
              } as UserType,
            }
          }),
        )

        setApplications(applicationsWithApplicants)
      } catch (error) {
        console.error("Error fetching job and applications:", error)
        toast.error("There was a problem loading the applications. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchJobAndApplications()
    }
  }, [id, user, router])

  const handleUpdateStatus = async (applicationId: string, status: string) => {
    try {
      await updateDoc(doc(db, "applications", applicationId), {
        status,
        updatedAt: new Date(),
      })

      // Update local state
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: status as Application["status"] } : app
        )
      )

      toast.success(`Application status changed to ${status}`)
    } catch (error) {
      console.error("Error updating application:", error)
      toast.error("There was a problem updating the application status. Please try again later.")
    }
  }

  const handleContactApplicant = async (applicantId: string) => {
    if (!user) return

    try {
      // Create chat channel
      await createOrGetChatChannel(applicantId, user.id)
      // Redirect to messages
      router.push("/messages")
    } catch (error) {
      console.error("Error creating chat:", error)
      toast.error("There was a problem creating the chat. Please try again later.")
    }
  }

  const filteredApplications =
    activeTab === "all" ? applications : applications.filter((app) => app.status === activeTab)

  if (authLoading || loading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user || user.role !== "recruiter" || !job) {
    return null
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-2 mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">{job.title}</h1>
          <p className="text-muted-foreground">
            {job.companyName} • {job.location}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="text-muted-foreground">
            {applications.length} application{applications.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="reviewing">Reviewing</TabsTrigger>
          <TabsTrigger value="shortlisted">Shortlisted</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="hired">Hired</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "all"
                  ? "All Applications"
                  : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Applications`}
              </CardTitle>
              <CardDescription>
                {activeTab === "all"
                  ? "View all applications for this job"
                  : `View ${activeTab} applications for this job`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredApplications.length > 0 ? (
                <div className="space-y-4">
                  {filteredApplications.map((application) => (
                    <ApplicantCard
                      key={application.id}
                      application={application}
                      onUpdateStatus={handleUpdateStatus}
                      onContact={handleContactApplicant}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-medium mb-2">No applications found</h3>
                  <p className="text-muted-foreground">
                    {activeTab === "all"
                      ? "There are no applications for this job yet"
                      : `There are no ${activeTab} applications for this job`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
