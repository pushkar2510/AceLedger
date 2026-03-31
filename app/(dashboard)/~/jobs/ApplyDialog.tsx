"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { CandidateOpportunity } from "./_types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ApplyDialogProps {
  job: CandidateOpportunity;
  candidateId: string;
  onApplySuccess: () => void;
}

export function ApplyDialog({ job, candidateId, onApplySuccess }: ApplyDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [coverLetter, setCoverLetter] = useState("")

  const handleApply = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      const { error } = await supabase.from("applications").insert({
        opportunity_id: job.id,
        candidate_id: candidateId,
        cover_letter: coverLetter.trim() || null,
        status: "pending"
      })

      if (error) {
        throw new Error(error.message)
      }

      toast.success("Application Submitted!", {
        description: `You have successfully applied for ${job.title} at ${job.company_name}.`,
      })
      
      onApplySuccess()
      setOpen(false)
    } catch (err: any) {
      toast.error("Application Failed", {
        description: err.message || "An error occurred while submitting your application.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white">Apply Now</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Apply for {job.title}</DialogTitle>
          <DialogDescription>
            Submit your application to {job.company_name}. Make sure your profile and resume are up to date!
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4 mt-2 border-t">
          <div className="flex flex-col gap-2">
            <h4 className="font-semibold text-sm">Cover Letter (Optional)</h4>
            <Textarea 
              placeholder="Why are you a great fit for this role?"
              className="resize-none h-32"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={loading} className="min-w-[100px]">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
