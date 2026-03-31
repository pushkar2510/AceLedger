"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save, Briefcase, Calendar, MapPin, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import type { Opportunity, OpportunityStatus } from "../../_types"

export function PostingsEditClient({ posting }: { posting: Opportunity }) {
  const router = useRouter()
  const supabase = createClient()
  const isNew = posting.id === "new"

  const [title, setTitle] = useState(posting.title || "")
  const [description, setDescription] = useState(posting.description || "")
  const [location, setLocation] = useState(posting.location || "")
  const [isRemote, setIsRemote] = useState(posting.is_remote ?? false)
  const [stipend, setStipend] = useState(posting.stipend || "")
  const [duration, setDuration] = useState(posting.duration || "")
  const [status, setStatus] = useState<OpportunityStatus>(posting.status || "draft")
  const [requiredSkillsStr, setRequiredSkillsStr] = useState(posting.required_skills?.join(", ") || "")
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required")
      return
    }

    setSaving(true)
    const skillsArray = requiredSkillsStr.split(",").map(s => s.trim()).filter(Boolean)

    const payload = {
      recruiter_id: posting.recruiter_id,
      title,
      description,
      location: location || null,
      is_remote: isRemote,
      stipend: stipend || null,
      duration: duration || null,
      status,
      required_skills: skillsArray,
      updated_at: new Date().toISOString()
    }

    let error;

    if (isNew) {
      const { error: insertError, data } = await supabase.from("opportunities").insert(payload).select().single()
      error = insertError
      if (!error && data) {
        toast.success("Job posting created successfully")
        router.push(`/~/postings/${data.id}`)
        return
      }
    } else {
      const { error: updateError } = await supabase.from("opportunities").update(payload).eq("id", posting.id)
      error = updateError
    }

    setSaving(false)

    if (error) {
      toast.error(error.message || "Failed to save posting")
    } else {
      toast.success("Job posting updated successfully")
      if (!isNew) {
        router.refresh()
      }
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 md:px-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="h-9 w-9 border">
            <Link href="/~/postings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="space-y-0.5 min-w-0">
            <h1 className="text-xl font-semibold tracking-tight truncate">
              {isNew ? "Create Job Posting" : "Edit Job Posting"}
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              {isNew ? "Draft a new opportunity" : posting.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Posting
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8">
        {/* Main Form */}
        <div className="space-y-6">
          <div className="space-y-4 bg-card border rounded-xl p-5">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              Basic Details
            </h2>

            <div className="space-y-2">
              <Label htmlFor="title">Job Title <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                placeholder="e.g. Frontend Developer Intern"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Job Description <span className="text-red-500">*</span></Label>
              <Textarea
                id="desc"
                placeholder="Describe the responsibilities, requirements, and benefits..."
                className="min-h-[200px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">This will be used by the AI Resume Analyzer to grade candidates.</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="skills">Required Skills (Comma separated)</Label>
              <Input
                id="skills"
                placeholder="React, TypeScript, Node.js"
                value={requiredSkillsStr}
                onChange={(e) => setRequiredSkillsStr(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4 bg-card border rounded-xl p-5">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              Location & Details
            </h2>

            <div className="flex items-center gap-4 py-2">
              <Checkbox 
                id="remote" 
                checked={isRemote} 
                onCheckedChange={(val) => setIsRemote(Boolean(val))} 
              />
              <div className="space-y-0.5">
                <Label htmlFor="remote" className="font-normal border-b-0 cursor-pointer text-sm">
                  This role allows remote work
                </Label>
              </div>
            </div>

            {!isRemote && (
              <div className="space-y-2 mt-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. Pune, Maharashtra"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mt-4">
               <div className="space-y-2">
                <Label htmlFor="stipend">Stipend / Salary Range</Label>
                <Input
                  id="stipend"
                  placeholder="e.g. ₹20,000/month or Unpaid"
                  value={stipend}
                  onChange={(e) => setStipend(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  placeholder="e.g. 6 Months"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Status & Visibility
            </h2>
            <div className="space-y-2 px-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="status-select" className="text-sm font-medium">Status</Label>
                <select
                  id="status-select"
                  className="bg-transparent border rounded text-sm p-1"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OpportunityStatus)}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Closed / Archived</option>
                </select>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                {status === "draft" && "Only visible to you."}
                {status === "published" && "Live and accepting applications."}
                {status === "archived" && "Archived and hidden from lists. No longer accepting applications."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
