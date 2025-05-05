"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Job } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building, MapPin, Clock } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { LoadingSpinner } from "@/components/loading-spinner"
import { toDate } from "@/lib/utils"
import { toast } from "sonner"

interface RecommendedJobsProps {
  userId: string
  interests: string[]
}

export function RecommendedJobs({ userId, interests }: RecommendedJobsProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecommendedJobs() {
      try {
        // Query for active jobs with a limit
        const jobsQuery = query(
          collection(db, "jobs"),
          where("status", "==", "active"),
          limit(20), // Limit to 20 jobs to avoid loading too many
        )

        const jobsSnapshot = await getDocs(jobsQuery)
        const jobsData: Job[] = []

        jobsSnapshot.forEach((doc) => {
          const jobData = {
            id: doc.id,
            ...doc.data(),
          } as Job

          // Ensure skills is always an array
          if (!jobData.skills) {
            jobData.skills = []
          }

          jobsData.push(jobData)
        })

        if (interests.length === 0) {
          // If no interests, just sort by date
          const sortedJobs = jobsData.sort((a, b) => {
            const dateA = toDate(a.postedAt)
            const dateB = toDate(b.postedAt)
            return dateB.getTime() - dateA.getTime()
          })

          setJobs(sortedJobs.slice(0, 6))
          setLoading(false)
          return
        }

        // Filter and sort jobs based on interests
        const matchingJobs = jobsData.filter(
          (job) =>
            job.skills &&
            job.skills.some((skill) => interests.some((interest) => interest.toLowerCase() === skill.toLowerCase())),
        )

        // If no matching jobs, just use recent jobs
        const jobsToShow = matchingJobs.length > 0 ? matchingJobs : jobsData

        // Sort by date
        const sortedJobs = jobsToShow.sort((a, b) => {
          const dateA = toDate(a.postedAt)
          const dateB = toDate(b.postedAt)
          return dateB.getTime() - dateA.getTime()
        })

        setJobs(sortedJobs.slice(0, 6))
      } catch (error) {
        console.error("Error fetching recommended jobs:", error)
        toast.error("There was a problem loading job recommendations. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendedJobs()
  }, [userId, interests])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended Jobs</CardTitle>
        <CardDescription>
          {interests.length > 0 ? "Jobs matching your interests and skills" : "Popular jobs you might be interested in"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : jobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="block">
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex flex-col h-full">
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">{job.title}</h3>
                          <Badge variant={job.employmentType === "full-time" ? "default" : "outline"}>
                            {job.employmentType.replace("-", " ")}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building className="h-4 w-4" />
                            <span>{job.companyName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {job.location} ({job.locationType})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Posted {formatDistanceToNow(toDate(job.postedAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto pt-4">
                        <div className="flex flex-wrap gap-2">
                          {job.skills &&
                            job.skills.slice(0, 3).map((skill) => (
                              <Badge
                                key={skill}
                                variant={
                                  interests.some((i) => i.toLowerCase() === skill.toLowerCase())
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {skill}
                              </Badge>
                            ))}
                          {job.skills && job.skills.length > 3 && (
                            <Badge variant="secondary">+{job.skills.length - 3} more</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <h3 className="text-xl font-medium mb-2">No recommended jobs found</h3>
            <p className="text-muted-foreground mb-4">
              {interests.length > 0
                ? "Try updating your interests in your profile"
                : "Check back soon for new opportunities"}
            </p>
            <Button asChild>
              <Link href="/jobs">Browse All Jobs</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
