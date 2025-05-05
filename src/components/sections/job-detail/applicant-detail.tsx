"use client"

import { useState } from "react"
import type { Application, User } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow, format } from "date-fns"
import { Download, MessageSquare, Calendar, FileText, ExternalLink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toDate } from "@/lib/utils"

interface ApplicantDetailProps {
  application: Application
  applicant: User
}

export function ApplicantDetail({ application, applicant }: ApplicantDetailProps) {
  const [open, setOpen] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="mr-2 h-4 w-4" />
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Applicant Details</DialogTitle>
          <DialogDescription>
            Applied {formatDistanceToNow(toDate(application.appliedAt), { addSuffix: true })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={applicant.photoURL || "/placeholder.svg"} />
              <AvatarFallback>{getInitials(applicant.displayName)}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h2 className="text-xl font-semibold">{applicant.displayName}</h2>
              {applicant.profile?.headline && <p className="text-muted-foreground">{applicant.profile.headline}</p>}
              <p className="text-sm text-muted-foreground">{applicant.email}</p>

              <div className="flex flex-wrap gap-2 mt-2">
                {applicant.profile?.skills?.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Tabs defaultValue="profile">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="application">Application</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              {applicant.profile?.bio && (
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{applicant.profile.bio}</p>
                  </CardContent>
                </Card>
              )}

              {applicant.profile?.experience && applicant.profile.experience.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Experience</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {applicant.profile.experience.map((exp) => (
                      <div key={exp.id} className="border-b pb-4 last:border-0 last:pb-0">
                        <h3 className="font-medium">{exp.title}</h3>
                        <p className="text-muted-foreground">{exp.company}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(toDate(exp.startDate), "MMM yyyy")} -{" "}
                          {exp.current ? "Present" : exp.endDate ? format(toDate(exp.endDate), "MMM yyyy") : ""}
                        </p>
                        {exp.description && <p className="mt-2">{exp.description}</p>}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {applicant.profile?.education && applicant.profile.education.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Education</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {applicant.profile.education.map((edu) => (
                      <div key={edu.id} className="border-b pb-4 last:border-0 last:pb-0">
                        <h3 className="font-medium">
                          {edu.degree} in {edu.field}
                        </h3>
                        <p className="text-muted-foreground">{edu.institution}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(toDate(edu.startDate), "yyyy")} -{" "}
                          {edu.current ? "Present" : edu.endDate ? format(toDate(edu.endDate), "yyyy") : ""}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="application" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Application Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Status</h3>
                    <Badge>{application.status.charAt(0).toUpperCase() + application.status.slice(1)}</Badge>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Resume</h3>
                    <Button asChild variant="outline">
                      <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Download Resume
                      </a>
                    </Button>
                  </div>

                  {application.coverLetter && (
                    <div className="space-y-2">
                      <h3 className="font-medium">Cover Letter</h3>
                      <div className="bg-muted p-4 rounded-md">
                        <p>{application.coverLetter}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`mailto:${applicant.email}`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Email Applicant
                  </a>
                </Button>

                <Button variant="outline" size="sm" asChild>
                  <a href="/interviews/schedule" target="_blank" rel="noopener noreferrer">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Interview
                  </a>
                </Button>

                {applicant.profile?.publicProfileUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={applicant.profile.publicProfileUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Public Profile
                    </a>
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
