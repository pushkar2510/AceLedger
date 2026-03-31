"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { fetchRecruiterTestsAction, inviteCandidateToTestAction } from "./actions"

export function AssignTestDialog({
  isOpen,
  onOpenChange,
  candidate,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  candidate: any | null
}) {
  const [tests, setTests] = useState<{ id: string; title: string }[]>([])
  const [loadingTests, setLoadingTests] = useState(false)
  
  const [selectedTestId, setSelectedTestId] = useState<string>("")
  const [message, setMessage] = useState("")
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Fetch recruiter's published tests when dialog opens
      setLoadingTests(true)
      fetchRecruiterTestsAction().then((res) => {
        if (res.error) toast.error(res.error)
        else setTests(res.tests || [])
        setLoadingTests(false)
      })
      // Reset form
      setSelectedTestId("")
      setMessage("")
    }
  }, [isOpen])

  async function handleAssign() {
    if (!candidate || !selectedTestId) return

    setAssigning(true)
    const res = await inviteCandidateToTestAction(candidate.profile_id, selectedTestId, message)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(`Test assigned to ${candidate.full_name}`)
      onOpenChange(false)
    }
    setAssigning(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Test</DialogTitle>
          <DialogDescription>
            Invite {candidate?.full_name} to take one of your published tests.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Select Test *</label>
            <Select disabled={loadingTests} value={selectedTestId} onValueChange={setSelectedTestId}>
              <SelectTrigger>
                <SelectValue placeholder={loadingTests ? "Loading tests..." : "Choose a test"} />
              </SelectTrigger>
              <SelectContent>
                {tests.length === 0 ? (
                  <SelectItem value="empty" disabled>No published tests found</SelectItem>
                ) : (
                  tests.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Message (Optional)</label>
            <Textarea 
              placeholder="Add a brief note..." 
              value={message} 
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!selectedTestId || assigning} onClick={handleAssign}>
            {assigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
