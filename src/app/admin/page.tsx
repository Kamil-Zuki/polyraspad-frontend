"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Search, ShieldAlert, ShieldCheck, UserCog, Loader2 } from "lucide-react"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle,
} from "@/components/ui/sheet"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

export default function AdminPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [planFilter, setPlanFilter] = useState("all")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    title: string
    description?: string
    onConfirm: () => void
    variant?: "destructive" | "warning" | "primary"
  }>({
    isOpen: false,
    title: "",
    onConfirm: () => {},
  })
  
  // Real active search value to avoid re-fetching on every keystroke immediately (or we could use a debounced hook, but let's just fetch on enter/button for simplicity)
  const [activeSearch, setActiveSearch] = useState("")

  // --- Users Query ---
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["admin", "users", 1, 50, activeSearch, planFilter],
    queryFn: () => apiClient.admin.getUsers(1, 50, activeSearch, planFilter),
  })

  // --- Plans Query ---
  const { data: plansData, isLoading: isLoadingPlans } = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: () => apiClient.billing.listPlans(false),
  })

  // --- User Detail Query ---
  const { data: userDetail, isLoading: isLoadingUserDetail } = useQuery({
    queryKey: ["admin", "user", selectedUserId],
    queryFn: () => apiClient.admin.getUserDetail(selectedUserId!),
    enabled: !!selectedUserId,
  })

  // --- Update Entitlements Mutation ---
  const updateEntitlementsMutation = useMutation({
    mutationFn: ({ planId, entitlements }: { planId: string; entitlements: Record<string, string> }) =>
      apiClient.admin.updatePlanEntitlements(planId, entitlements),
    onSuccess: () => {
      toast.success("Plan entitlements updated successfully")
      queryClient.invalidateQueries({ queryKey: ["admin", "plans"] })
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update entitlements")
    },
  })

  // --- Lockout Mutation ---
  const setLockoutMutation = useMutation({
    mutationFn: ({ userId, lock }: { userId: string; lock: boolean }) =>
      apiClient.admin.setUserLockout(userId, lock),
    onSuccess: (_, variables) => {
      toast.success(variables.lock ? "User banned" : "User unbanned")
      queryClient.invalidateQueries({ queryKey: ["admin", "user", variables.userId] })
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    },
    onError: (error: any) => toast.error(error?.message || "Failed to change lockout status"),
  })

  // --- Assign Plan Mutation ---
  const assignPlanMutation = useMutation({
    mutationFn: ({ userId, planCode }: { userId: string; planCode: string }) =>
      apiClient.admin.assignUserPlan(userId, planCode),
    onSuccess: (_, variables) => {
      toast.success("Plan assigned successfully")
      queryClient.invalidateQueries({ queryKey: ["admin", "user", variables.userId] })
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    },
    onError: (error: any) => toast.error(error?.message || "Failed to assign plan"),
  })

  const handleUpdateEntitlements = (planId: string, currentEntitlements: Record<string, string>) => {
    const rawInput = prompt(
      "Enter entitlements JSON:",
      JSON.stringify(currentEntitlements, null, 2)
    )
    if (!rawInput) return

    try {
      const parsed = JSON.parse(rawInput)
      updateEntitlementsMutation.mutate({ planId, entitlements: parsed })
    } catch (e) {
      toast.error("Invalid JSON format")
    }
  }

  const handleSearch = () => setActiveSearch(searchQuery)

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-primary">Admin Dashboard</h1>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Users Management</TabsTrigger>
          <TabsTrigger value="plans">Plans & Entitlements</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1 flex gap-2">
              <Input 
                placeholder="Search by email or username..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-sm bg-app-surface"
              />
              <Button onClick={handleSearch} variant="secondary">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
            
            <div className="w-[200px]">
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="bg-app-surface">
                  <SelectValue placeholder="Filter by Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  {plansData?.map(p => (
                    <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-app-surface rounded-lg border border-app-border overflow-hidden">
            {isLoadingUsers ? (
              <div className="p-12 flex justify-center text-brand-secondary">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-brand-secondary uppercase bg-app-bg border-b border-app-border">
                  <tr>
                    <th className="px-6 py-4">User Info</th>
                    <th className="px-6 py-4">Plan Code</th>
                    <th className="px-6 py-4">Registration</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData?.users?.map((user) => (
                    <tr key={user.id} className="border-b border-app-border hover:bg-app-hover transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-brand-primary">{user.email}</div>
                        <div className="text-xs text-brand-secondary font-mono mt-1 truncate max-w-[200px]">{user.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-brand-primary/10 text-brand-primary rounded-md font-medium text-xs uppercase tracking-wider">
                          {user.planCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-brand-secondary">
                        {new Date(user.registrationDate || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {user.isLockedOut ? (
                          <span className="flex items-center text-red-500 text-xs font-medium bg-red-500/10 px-2.5 py-1 rounded-md w-max">
                            <ShieldAlert className="w-3 h-3 mr-1" />
                            Banned
                          </span>
                        ) : (
                          <span className="flex items-center text-green-500 text-xs font-medium bg-green-500/10 px-2.5 py-1 rounded-md w-max">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedUserId(user.id)}
                        >
                          <UserCog className="w-4 h-4 mr-2" />
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {usersData?.users?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-brand-secondary">
                        No users found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          {isLoadingPlans ? (
            <div className="p-12 flex justify-center text-brand-secondary">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plansData?.map((plan) => (
                <div key={plan.id} className="p-6 bg-app-surface rounded-lg border border-app-border space-y-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-brand-primary">{plan.name}</h3>
                      <p className="text-sm text-brand-secondary font-mono">{plan.code}</p>
                    </div>
                    <span className="text-lg font-black">{plan.price} {plan.currency}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-secondary">Entitlements</h4>
                    <pre className="p-4 bg-app-bg rounded-lg text-xs font-mono overflow-auto border border-app-border">
                      {JSON.stringify(plan.entitlements, null, 2)}
                    </pre>
                  </div>

                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={() => handleUpdateEntitlements(plan.id, plan.entitlements)}
                    disabled={updateEntitlementsMutation.isPending}
                  >
                    Edit JSON Entitlements
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* User Details Sheet */}
      <Sheet open={!!selectedUserId} onOpenChange={(open) => !open && setSelectedUserId(null)}>
        <SheetContent className="bg-app-surface border-app-border sm:max-w-md w-full overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl font-bold">User Management</SheetTitle>
            <SheetDescription>
              View and manage user access, billing, and status.
            </SheetDescription>
          </SheetHeader>

          {isLoadingUserDetail ? (
            <div className="flex justify-center p-12 text-brand-secondary">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : userDetail ? (
            <div className="space-y-8">
              {/* Profile Block */}
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-brand-secondary uppercase tracking-wider mb-3">Profile Info</h4>
                <div className="bg-app-bg p-4 rounded-lg border border-app-border space-y-3">
                  <div>
                    <div className="text-xs text-brand-secondary mb-1">Email</div>
                    <div className="font-medium">{userDetail.email}</div>
                  </div>
                  <div>
                    <div className="text-xs text-brand-secondary mb-1">Username</div>
                    <div className="font-medium">{userDetail.userName || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-brand-secondary mb-1">User ID</div>
                    <div className="font-mono text-xs">{userDetail.id}</div>
                  </div>
                </div>
              </div>

              {/* Status & Ban Block */}
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-brand-secondary uppercase tracking-wider mb-3">Account Status</h4>
                <div className="bg-app-bg p-4 rounded-lg border border-app-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {userDetail.isLockedOut ? (
                      <>
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                          <ShieldAlert className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <div className="font-semibold text-red-500">Banned</div>
                          <div className="text-xs text-brand-secondary">User cannot log in</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <ShieldCheck className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <div className="font-semibold text-green-500">Active</div>
                          <div className="text-xs text-brand-secondary">User is in good standing</div>
                        </div>
                      </>
                    )}
                  </div>
                  <Button
                    variant={userDetail.isLockedOut ? "outline" : "destructive"}
                    size="sm"
                    disabled={setLockoutMutation.isPending}
                    onClick={() => {
                      setConfirmConfig({
                        isOpen: true,
                        title: userDetail.isLockedOut ? "Unban this user?" : "Ban this user?",
                        description: userDetail.isLockedOut
                          ? "This will restore user login access."
                          : "They will not be able to log in until unbanned.",
                        variant: userDetail.isLockedOut ? "primary" : "destructive",
                        onConfirm: () => {
                          setLockoutMutation.mutate({ userId: userDetail.id, lock: !userDetail.isLockedOut })
                        },
                      })
                    }}
                  >
                    {setLockoutMutation.isPending ? "Applying..." : userDetail.isLockedOut ? "Unban User" : "Ban User"}
                  </Button>
                </div>
              </div>

              {/* Plan Management Block */}
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-brand-secondary uppercase tracking-wider mb-3">Billing & Plan</h4>
                <div className="bg-app-bg p-4 rounded-lg border border-app-border space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-brand-secondary mb-1">Current Plan Code</div>
                      <div className="font-semibold uppercase tracking-wider">{userDetail.planCode}</div>
                    </div>
                    {userDetail.subscription && (
                      <div className="text-right">
                        <div className="text-xs text-brand-secondary mb-1">Provider</div>
                        <div className="font-medium capitalize">{userDetail.subscription.provider}</div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-app-border">
                    <div className="text-xs text-brand-secondary mb-2">Assign New Plan Manually</div>
                    <div className="flex gap-2">
                      <Select 
                        onValueChange={(val) => {
                          setConfirmConfig({
                            isOpen: true,
                            title: `Assign plan "${val}" to this user?`,
                            description: "This will cancel their active subscription and force the new plan.",
                            variant: "warning",
                            onConfirm: () => {
                              assignPlanMutation.mutate({ userId: userDetail.id, planCode: val })
                            },
                          })
                        }}
                      >
                        <SelectTrigger className="w-full bg-app-surface">
                          <SelectValue placeholder="Select Plan to Force Assign" />
                        </SelectTrigger>
                        <SelectContent>
                          {plansData?.map(p => (
                            <SelectItem key={p.code} value={p.code}>{p.name} ({p.code})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-brand-secondary">User not found</div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        description={confirmConfig.description}
        variant={confirmConfig.variant}
      />
    </div>
  )
}

