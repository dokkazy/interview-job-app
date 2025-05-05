"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Job, Application, User } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/loading-spinner"
import { formatDistanceToNow, format } from "date-fns"
import { Edit, Users, XCircle, Search } from "lucide-react"
import Link from "next/link"
import { ApplicantCard } from "@/components/card/applicant-card"
import { toDate } from "@/lib/utils"
import { toast } from "sonner"

interface RecruiterViewProps {
  job: Job
}

type ApplicantWithDetails = Application & { applicant: User }

export function RecruiterView({ job }: RecruiterViewProps) {
  const router = useRouter()

  const [applications, setApplications] = useState<ApplicantWithDetails[]>([])
  const [filteredApplications, setFilteredApplications] = useState<ApplicantWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)
  const [opening, setOpening] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("recent")

  useEffect(() => {
    async function fetchApplications() {
      try {
        const applicationsQuery = query(collection(db, "applications"), where("jobId", "==", job.id))

        const applicationsSnapshot = await getDocs(applicationsQuery)
        const applicationsData: Application[] = []

        applicationsSnapshot.forEach((doc) => {
          applicationsData.push({
            id: doc.id,
            ...doc.data(),
          } as Application)
        })

        // Get applicant details for each application
        const applicationsWithDetails = await Promise.all(
          applicationsData.map(async (application) => {
            try {
              const applicantDoc = await getDoc(doc(db, "users", application.applicantId))
              if (!applicantDoc.exists()) {
                throw new Error("Applicant not found")
              }

              return {
                ...application,
                applicant: {
                  id: applicantDoc.id,
                  ...applicantDoc.data(),
                } as User,
              }
            } catch (error) {
              console.error(`Error fetching applicant for application ${application.id}:`, error)
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
              }
            }
          }),
        )

        setApplications(applicationsWithDetails)
        setFilteredApplications(applicationsWithDetails)
      } catch (error) {
        console.error("Error fetching applications:", error)
        toast.error("There was a problem loading the applications. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [job.id])

  useEffect(() => {
    // Apply filters and sorting
    let filtered = [...applications]

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter)
    }

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (app) =>
          app.applicant.displayName.toLowerCase().includes(term) ||
          (app.applicant.profile?.headline && app.applicant.profile.headline.toLowerCase().includes(term)) ||
          (app.applicant.profile?.skills &&
            app.applicant.profile.skills.some((skill) => skill.toLowerCase().includes(term))),
      )
    }

    // Apply sorting
    if (sortBy === "recent") {
      filtered.sort((a, b) => {
        const dateA = toDate(a.appliedAt)
        const dateB = toDate(b.appliedAt)
        return dateB.getTime() - dateA.getTime()
      })
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => {
        const dateA = toDate(a.appliedAt)
        const dateB = toDate(b.appliedAt)
        return dateA.getTime() - dateB.getTime()
      })
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.applicant.displayName.localeCompare(b.applicant.displayName))
    }

    setFilteredApplications(filtered)
  }, [applications, statusFilter, searchTerm, sortBy])

  const handleCloseJob = async () => {
    if (closing) return

    setClosing(true)

    try {
      await updateDoc(doc(db, "jobs", job.id), {
        status: "closed",
      })

      toast.success("The job listing has been closed")

      // Update local state
      router.refresh()
    } catch (error) {
      console.error("Error closing job:", error)
      toast.error("There was a problem closing the job. Please try again later.")
    } finally {
      setClosing(false)
    }
  }

  const handleOpenJob = async () => {
    if (opening) return
    setOpening(true)
    try {
      await updateDoc(doc(db, "jobs", job.id), {
        status: "active",
      })
      toast.success("The job listing has been reopened")
      router.refresh()
    } catch (error) {
      console.error("Error opening job:", error)
      toast.error("There was a problem opening the job. Please try again later.")
    } finally {
      setOpening(false)
    }
  }

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
      toast.error("There was a problem updating the application. Please try again later.")
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleContactApplicant = (applicantId: string) => {
    router.push("/messages")
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">{job.title}</h1>
            <Badge variant={job.status === "active" ? "default" : "outline"}>
              {job.status === "active" ? "Active" : "Closed"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {job.companyName} • {job.location} • Posted {formatDistanceToNow(job.postedAt, { addSuffix: true })}
          </p>
      </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/jobs/edit/${job.id}`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Job
            </Link>
          </Button>
          {job.status === "active" && (
            <Button variant="outline" onClick={handleCloseJob} disabled={closing}>
              <XCircle className="mr-2 h-4 w-4" />
              {closing ? "Closing..." : "Close Job"}
            </Button>
          )}
          {job.status === "closed" && (
            <Button variant="outline" onClick={handleOpenJob} disabled={opening}>
              <span className="mr-2">🔓</span>
              {opening ? "Opening..." : "Open Job"}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Job Details</TabsTrigger>
          <TabsTrigger value="applications">
            Applications
            {applications.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {applications.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
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

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Job Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Location Type</p>
                      <p className="font-medium">{job.locationType}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Employment Type</p>
                      <p className="font-medium">{job.employmentType.replace("-", " ")}</p>
                    </div>
                  </div>

                  {job.salary && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Salary Range</p>
                      <p className="font-medium">
                        {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()} {job.salary.currency}
                      </p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Posted On</p>
                    <p className="font-medium">{format(job.postedAt, "MMMM d, yyyy")}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">{job.status.charAt(0).toUpperCase() + job.status.slice(1)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{applications.length} applications</span>
                    </div>

                    {applications.length > 0 && (
                      <Button asChild className="w-full">
                        <Link
                          href="#applications"
                          onClick={() => (document.querySelector('[data-value="applications"]') as HTMLElement | null)?.click()}
                        >
                          View All Applications
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="applications" id="applications">
          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
              <CardDescription>Manage applications for {job.title}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : applications.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search applicants..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Applications</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="reviewing">Reviewing</SelectItem>
                          <SelectItem value="shortlisted">Shortlisted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="hired">Hired</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recent">Most Recent</SelectItem>
                          <SelectItem value="oldest">Oldest First</SelectItem>
                          <SelectItem value="name">Applicant Name</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {filteredApplications.length > 0 ? (
                      filteredApplications.map((application) => (
                        <ApplicantCard
                          key={application.id}
                          application={application}
                          onUpdateStatus={handleUpdateStatus}
                          onContact={handleContactApplicant}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No applications match your filters</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-medium mb-2">No applications yet</h3>
                  <p className="text-muted-foreground">When job seekers apply to this job, they&apos;ll appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
