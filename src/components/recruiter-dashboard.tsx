"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { User, Job } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { PlusCircle, MessageSquare, Calendar } from "lucide-react"
import Link from "next/link"
import { JobListingCard } from "@/components/card/job-listing-card"
import { ApplicantsOverview } from "@/components/applicants-overview"
import { LoadingSpinner } from "@/components/loading-spinner"
import { toast } from "sonner"
import { toDate } from "@/lib/utils"

interface RecruiterDashboardProps {
  user: User
}

export function RecruiterDashboard({ user }: RecruiterDashboardProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [applicationsCount, setApplicationsCount] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchJobs() {
      try {
        // Get recruiter's jobs - simplified query to avoid potential issues
        const jobsQuery = query(collection(db, "jobs"), where("recruiterId", "==", user.id))

        const jobsSnapshot = await getDocs(jobsQuery)
        const jobsData: Job[] = []

        jobsSnapshot.forEach((doc) => {
          jobsData.push({
            id: doc.id,
            ...doc.data(),
          } as Job)
        })

        // Sort jobs by postedAt date in JavaScript instead of in the query
        const sortedJobs = jobsData.sort((a, b) => {
          const dateA = toDate(a.postedAt)
          const dateB = toDate(b.postedAt)
          return dateB.getTime() - dateA.getTime()
        })

        setJobs(sortedJobs)

        // Get application counts for each job
        const applicationCounts: Record<string, number> = {}

        await Promise.all(
          sortedJobs.map(async (job) => {
            try {
              const applicationsQuery = query(collection(db, "applications"), where("jobId", "==", job.id))
              const applicationsSnapshot = await getDocs(applicationsQuery)
              applicationCounts[job.id] = applicationsSnapshot.size
            } catch (error) {
              console.error(`Error fetching applications for job ${job.id}:`, error)
              applicationCounts[job.id] = 0
            }
          }),
        )

        setApplicationsCount(applicationCounts)
      } catch (error) {
        console.error("Error fetching jobs:", error)
        toast.error("There was a problem loading your job listings. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (user && user.id) {
      fetchJobs()
    } else {
      setLoading(false)
    }
  }, [user])

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user.displayName}</h1>
          <p className="text-muted-foreground">Manage your job listings and applicants</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/jobs/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Post New Job
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

      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs">My Job Listings</TabsTrigger>
          <TabsTrigger value="applicants">Recent Applicants</TabsTrigger>
        </TabsList>
        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Job Listings</CardTitle>
              <CardDescription>Manage your active and closed job listings</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <JobListingCard key={job.id} job={job} applicationsCount={applicationsCount[job.id] || 0} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">You haven&apos;t posted any jobs yet</p>
                  <Button asChild>
                    <Link href="/dashboard/jobs/new">Post Your First Job</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="applicants">
          <ApplicantsOverview recruiterId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
