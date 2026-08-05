"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { ArrowLeft, Loader2, Mail, Search, UsersRound } from "lucide-react";
import Stepper, { Step } from "@/components/stepper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  useAddTenantTeamMembers,
  useCreateTenantTeam,
  useGetTenantTeam,
  useListChatwootAgents,
  useListTenantTeamMembers,
  useListTenantTeams,
  useRemoveTenantTeamMembers,
  useUpdateTenantTeam,
} from "@/hooks/chatwoot/use-chatwoot";
import { useAuth } from "@/contexts/auth-context";

interface TeamFormValues {
  name: string;
  description: string;
  allow_auto_assign: boolean;
}

type AgentOption = {
  id: string;
  name: string;
  email: string;
  thumbnail?: string;
};

interface TeamFormActionPageProps {
  teamId?: string;
}

function coerceRecords(value: unknown): Record<string, unknown>[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

function extractRecords(response: unknown): Record<string, unknown>[] {
  const direct = coerceRecords(response);
  if (direct) return direct;
  if (!response || typeof response !== "object") return [];

  const root = response as Record<string, unknown>;
  const data = root.data as Record<string, unknown> | unknown[] | undefined;

  const fromDataArray = coerceRecords(data);
  if (fromDataArray) return fromDataArray;

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const payload = coerceRecords(data.payload);
    if (payload) return payload;

    const teams = coerceRecords(data.teams);
    if (teams) return teams;

    const agents = coerceRecords(data.agents);
    if (agents) return agents;

    const members = coerceRecords(data.members ?? data.team_members);
    if (members) return members;

    const nested = coerceRecords(data.data);
    if (nested) return nested;

    const chatwoot = data.messaging as Record<string, unknown> | undefined;
    if (chatwoot) {
      const chatwootPayload = coerceRecords(chatwoot.payload);
      if (chatwootPayload) return chatwootPayload;

      const chatwootData = coerceRecords(chatwoot.data);
      if (chatwootData) return chatwootData;

      if ("name" in chatwoot || "id" in chatwoot) {
        return [chatwoot];
      }
    }
  }

  return [];
}

function unwrapTeamRecord(
  value: unknown,
  depth = 0,
): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || depth > 5) return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = unwrapTeamRecord(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  const record = value as Record<string, unknown>;

  // Team entity thường có name (và thường có id)
  if (typeof record.name === "string") {
    return record;
  }

  const candidates = [
    record.payload,
    record.team,
    record.messaging,
    record.data,
  ];

  for (const candidate of candidates) {
    const found = unwrapTeamRecord(candidate, depth + 1);
    if (found) return found;
  }

  return null;
}

function extractSingleRecord(
  response: unknown,
): Record<string, unknown> | null {
  if (!response || typeof response !== "object") return null;
  const root = response as Record<string, unknown>;

  const fromRootData = unwrapTeamRecord(root.data);
  if (fromRootData) return fromRootData;

  const fromRoot = unwrapTeamRecord(root);
  if (fromRoot) return fromRoot;

  return extractRecords(response)[0] ?? null;
}

function normalizeTeamFormValues(
  record: Record<string, unknown> | null | undefined,
): TeamFormValues | null {
  if (!record) return null;
  const name = String(record.name ?? "").trim();
  if (!name) return null;

  return {
    name,
    description: String(record.description ?? "").trim(),
    allow_auto_assign: Boolean(record.allow_auto_assign ?? false),
  };
}

function readId(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number") {
    const id = String(value).trim();
    return id || null;
  }
  return null;
}

function extractIdFromRecord(
  record: Record<string, unknown> | null | undefined,
): string | null {
  if (!record) return null;

  const direct = readId(record.id ?? record.team_id ?? record.teamId);
  if (direct) return direct;

  const team = record.team as Record<string, unknown> | undefined;
  const fromTeam = readId(team?.id ?? team?.team_id);
  if (fromTeam) return fromTeam;

  const payload = record.payload;
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const fromPayload = extractIdFromRecord(payload as Record<string, unknown>);
    if (fromPayload) return fromPayload;
  }
  if (Array.isArray(payload) && payload[0] && typeof payload[0] === "object") {
    const fromPayloadItem = extractIdFromRecord(
      payload[0] as Record<string, unknown>,
    );
    if (fromPayloadItem) return fromPayloadItem;
  }

  const nestedData = record.data;
  if (
    nestedData &&
    typeof nestedData === "object" &&
    !Array.isArray(nestedData)
  ) {
    const fromNested = extractIdFromRecord(
      nestedData as Record<string, unknown>,
    );
    if (fromNested) return fromNested;
  }

  const chatwoot = record.messaging as Record<string, unknown> | undefined;
  if (chatwoot) {
    const fromChatwoot = extractIdFromRecord(chatwoot);
    if (fromChatwoot) return fromChatwoot;
  }

  return null;
}

function extractEntityId(response: unknown): string | null {
  if (!response || typeof response !== "object") return null;
  const root = response as Record<string, unknown>;

  const fromRoot = extractIdFromRecord(root);
  if (fromRoot) return fromRoot;

  if (root.data && typeof root.data === "object") {
    if (Array.isArray(root.data)) {
      const first = root.data[0];
      if (first && typeof first === "object") {
        return extractIdFromRecord(first as Record<string, unknown>);
      }
      return null;
    }
    return extractIdFromRecord(root.data as Record<string, unknown>);
  }

  return null;
}

function isSuccessResponse(response: unknown): boolean {
  if (!response || typeof response !== "object") return false;
  const statusCode = (response as Record<string, unknown>).status_code;
  return statusCode === 200 || statusCode === 201;
}

function normalizeAgent(
  record: Record<string, unknown>,
  index: number,
): AgentOption {
  const name = String(record.available_name ?? record.name ?? "").trim();
  const email = String(record.email ?? "").trim();
  const id =
    String(record.id ?? record.user_id ?? record.uuid ?? "").trim() ||
    email ||
    `agent-${index + 1}`;
  const thumbnail = String(
    record.thumbnail ?? record.avatar_url ?? record.avatarUrl ?? "",
  ).trim();

  return {
    id,
    name: name || `Agent ${index + 1}`,
    email: email || "N/A",
    thumbnail: thumbnail || undefined,
  };
}

function extractMemberIds(response: unknown): string[] {
  return extractRecords(response)
    .map((record) =>
      String(
        record.user_id ?? record.id ?? record.account_user_id ?? "",
      ).trim(),
    )
    .filter(Boolean);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0];
    const b = parts[parts.length - 1]?.[0];
    if (a && b) return (a + b).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

export function TeamFormActionPage({ teamId }: TeamFormActionPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? "";
  const isEdit = Boolean(teamId);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [initialMemberIds, setInitialMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [membersHydrated, setMembersHydrated] = useState(!isEdit);
  const [teamHydrated, setTeamHydrated] = useState(!isEdit);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<TeamFormValues>({
    defaultValues: {
      name: "",
      description: "",
      allow_auto_assign: true,
    },
  });

  const { data: teamResponse, isLoading: isLoadingTeam } = useGetTenantTeam(
    tenantId,
    teamId ?? "",
  );
  const { data: teamsListResponse, isLoading: isLoadingTeamsList } =
    useListTenantTeams(tenantId);
  const { data: membersResponse, isLoading: isLoadingMembers } =
    useListTenantTeamMembers(tenantId, teamId ?? "");
  const { data: agentsResponse, isLoading: isLoadingAgents } =
    useListChatwootAgents(tenantId);

  const createTeam = useCreateTenantTeam();
  const updateTeam = useUpdateTenantTeam();
  const addMembers = useAddTenantTeamMembers();
  const removeMembers = useRemoveTenantTeamMembers();

  const agents = useMemo(() => {
    return extractRecords(agentsResponse).map(normalizeAgent);
  }, [agentsResponse]);

  const filteredAgents = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(q) ||
        agent.email.toLowerCase().includes(q),
    );
  }, [agents, memberSearch]);

  useEffect(() => {
    if (!isEdit || !teamId || teamHydrated) return;

    // Ưu tiên detail API, fallback list teams (cùng data đã hiện ở card)
    const fromDetail = normalizeTeamFormValues(
      extractSingleRecord(teamResponse),
    );

    let fromList: TeamFormValues | null = null;
    if (!fromDetail && teamsListResponse) {
      const listRecords = extractRecords(teamsListResponse);
      const matched =
        listRecords.find(
          (item) => String(item.id ?? item.team_id ?? "").trim() === teamId,
        ) ?? null;
      fromList = normalizeTeamFormValues(matched);
    }

    const values = fromDetail ?? fromList;
    if (!values) {
      // Chờ data xong mới kết luận thất bại hydrate
      if (isLoadingTeam || isLoadingTeamsList) return;
      setTeamHydrated(true);
      return;
    }

    form.reset(values);
    setTeamHydrated(true);
  }, [
    form,
    isEdit,
    isLoadingTeam,
    isLoadingTeamsList,
    teamHydrated,
    teamId,
    teamResponse,
    teamsListResponse,
  ]);

  useEffect(() => {
    if (!isEdit || membersHydrated || isLoadingMembers) return;
    const ids = extractMemberIds(membersResponse);
    setInitialMemberIds(ids);
    setSelectedMemberIds(ids);
    setMembersHydrated(true);
  }, [isEdit, isLoadingMembers, membersHydrated, membersResponse]);

  const toggleMember = (agentId: string, checked: boolean) => {
    setSelectedMemberIds((prev) => {
      if (checked) {
        if (prev.includes(agentId)) return prev;
        return [...prev, agentId];
      }
      return prev.filter((id) => id !== agentId);
    });
  };

  const handleBackToList = () => {
    router.push("/settings/team");
  };

  const syncMembers = async (targetTeamId: string) => {
    const selectedSet = new Set(selectedMemberIds);
    const initialSet = new Set(initialMemberIds);

    const toAdd = selectedMemberIds.filter((id) => !initialSet.has(id));
    const toRemove = initialMemberIds.filter((id) => !selectedSet.has(id));

    if (toAdd.length > 0) {
      await addMembers.mutateAsync({
        tenantId,
        teamId: targetTeamId,
        data: { user_ids: toAdd },
      });
    }

    if (toRemove.length > 0) {
      await removeMembers.mutateAsync({
        tenantId,
        teamId: targetTeamId,
        data: { user_ids: toRemove },
      });
    }
  };

  const handleSubmitAll = async () => {
    const values = form.getValues();
    if (!values.name.trim()) {
      toast.error("Vui lòng nhập tên đội nhóm");
      setCurrentStep(1);
      return false;
    }
    if (!tenantId) {
      toast.error("Không tìm thấy tenant");
      return false;
    }

    setSubmitting(true);
    try {
      if (isEdit && teamId) {
        await updateTeam.mutateAsync({
          tenantId,
          teamId,
          data: {
            name: values.name.trim(),
            description: values.description.trim() || null,
            allow_auto_assign: values.allow_auto_assign,
          },
        });
        await syncMembers(teamId);
      } else {
        const createRes = await createTeam.mutateAsync({
          tenantId,
          data: {
            name: values.name.trim(),
            description: values.description.trim() || null,
            allow_auto_assign: values.allow_auto_assign,
          },
        });

        if (!isSuccessResponse(createRes)) {
          return false;
        }

        // Bắt buộc lấy team id từ response create trước khi gắn thành viên
        const createdTeamId = extractEntityId(createRes);
        if (!createdTeamId) {
          toast.error(
            "Tạo đội nhóm thành công nhưng không lấy được ID nhóm để thêm thành viên",
          );
          return false;
        }

        if (selectedMemberIds.length > 0) {
          await addMembers.mutateAsync({
            tenantId,
            teamId: createdTeamId,
            data: { user_ids: selectedMemberIds },
          });
        }
      }

      setCurrentStep(3);
      return true;
    } catch {
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const isBootstrapping =
    isEdit && (!teamHydrated || isLoadingMembers || !membersHydrated);
  const isBusy =
    submitting ||
    createTeam.isPending ||
    updateTeam.isPending ||
    addMembers.isPending ||
    removeMembers.isPending;
  const isSuccessStep = currentStep === 3;

  if (isBootstrapping) {
    return (
      <div className="w-full space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-105 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-start gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mt-0.5 shrink-0"
          onClick={handleBackToList}
          disabled={isBusy}
        >
          <ArrowLeft className="size-4" />
          <span className="sr-only">Quay lại</span>
        </Button>
        <div className="min-w-0 space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            {isEdit ? "Cập nhật đội nhóm" : "Tạo đội nhóm mới"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEdit
              ? "Chỉnh sửa thông tin và thành viên của đội nhóm."
              : "Thiết lập thông tin đội nhóm rồi chọn thành viên tham gia."}
          </p>
        </div>
      </div>

      <Stepper
        key={teamId ?? "create"}
        initialStep={1}
        activeStep={currentStep}
        onStepChange={(step) => {
          if (isSuccessStep) return;
          setCurrentStep(step);
        }}
        backButtonText="Quay lại"
        nextButtonText={
          currentStep === 2
            ? isEdit
              ? "Cập nhật nhóm"
              : "Tạo nhóm"
            : "Tiếp tục"
        }
        completeButtonText="Về danh sách"
        disableStepIndicators={isSuccessStep || isBusy}
        hideFooter={isSuccessStep}
        contentClassName="px-0.5"
        backButtonProps={{
          disabled: isBusy || isSuccessStep,
        }}
        nextButtonProps={{
          disabled:
            isBusy ||
            isSuccessStep ||
            (currentStep === 1 && !form.watch("name")?.trim()),
          onClick: (event) => {
            if (currentStep === 1) {
              const name = form.getValues("name")?.trim();
              if (!name) {
                event.preventDefault();
                form.setError("name", {
                  type: "required",
                  message: "Tên đội nhóm không được để trống",
                });
                toast.error("Vui lòng nhập tên đội nhóm");
              }
              return;
            }

            if (currentStep === 2) {
              event.preventDefault();
              void handleSubmitAll();
              return;
            }

            if (currentStep === 3) {
              event.preventDefault();
              handleBackToList();
            }
          },
        }}
      >
        <Step>
          <div className="space-y-4 px-1 pb-2 sm:px-1.5">
            <div className="space-y-1">
              <h3 className="text-base font-medium">Thông tin đội nhóm</h3>
              <p className="text-sm text-muted-foreground">
                Nhập tên, mô tả và cấu hình tự động gán hội thoại.
              </p>
            </div>

            <Form {...form}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  rules={{ required: "Tên đội nhóm không được để trống" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên đội nhóm</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nhập tên đội nhóm"
                          className="border-2 border-border"
                          disabled={isBusy || isSuccessStep}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mô tả</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Nhập mô tả (tùy chọn)"
                          rows={4}
                          className="border-2 border-border"
                          disabled={isBusy || isSuccessStep}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allow_auto_assign"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/40 px-3 py-3">
                      <div className="space-y-0.5 pr-4">
                        <FormLabel className="text-sm font-medium">
                          Tự động gán hội thoại
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Tự động phân bổ hội thoại mới cho thành viên trong đội
                          nhóm.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isBusy || isSuccessStep}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </Form>
          </div>
        </Step>

        <Step>
          <div className="space-y-4 px-1 pb-2 sm:px-1.5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-medium">Thành viên đội nhóm</h3>
                <p className="text-sm text-muted-foreground">
                  Chọn agent để thêm vào nhóm. Bỏ chọn để loại khỏi nhóm khi cập
                  nhật.
                </p>
              </div>
              <Badge variant="secondary" className="w-fit rounded-full">
                {selectedMemberIds.length} đã chọn
              </Badge>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={memberSearch}
                onChange={(event) => setMemberSearch(event.target.value)}
                placeholder="Tìm theo tên hoặc email…"
                className="border-2 border-border pl-9"
                disabled={isBusy || isSuccessStep}
              />
            </div>

            <div className="max-h-90 overflow-y-auto rounded-xl border border-border/70 bg-muted/30 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {isLoadingAgents ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Skeleton className="size-4 rounded" />
                      <Skeleton className="size-9 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-52" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                  <UsersRound className="size-8 text-muted-foreground/50" />
                  <p className="text-sm font-medium">Không có nhân viên</p>
                  <p className="text-xs text-muted-foreground">
                    {memberSearch.trim()
                      ? "Thử đổi từ khóa tìm kiếm."
                      : "Hãy thêm nhân viên hỗ trợ trước khi gán vào đội nhóm."}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {filteredAgents.map((agent) => {
                    const checked = selectedMemberIds.includes(agent.id);
                    return (
                      <li key={agent.id}>
                        <label
                          className={cn(
                            "flex cursor-pointer items-center gap-3 px-3 py-3 transition-colors hover:bg-background/70",
                            checked && "bg-primary/5",
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              toggleMember(agent.id, value === true)
                            }
                            disabled={isBusy || isSuccessStep}
                          />
                          <Avatar className="size-9 rounded-lg border border-border/60">
                            {agent.thumbnail ? (
                              <AvatarImage
                                src={agent.thumbnail}
                                alt={agent.name}
                                className="rounded-lg object-cover"
                              />
                            ) : null}
                            <AvatarFallback className="rounded-lg text-xs">
                              {initials(agent.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {agent.name}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                              <Mail className="size-3 shrink-0" />
                              <span translate="no">{agent.email}</span>
                            </p>
                          </div>
                          {initialMemberIds.includes(agent.id) ? (
                            <Badge
                              variant="outline"
                              className="shrink-0 text-[10px]"
                            >
                              Đang trong nhóm
                            </Badge>
                          ) : null}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {isBusy ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Đang lưu đội nhóm và thành viên...
              </p>
            ) : null}
          </div>
        </Step>

        <Step>
          <div className="flex flex-col items-center gap-3 py-4 sm:flex-row sm:items-center sm:justify-center sm:gap-2 sm:py-6 sm:text-left">
            <div className="h-40 w-40 shrink-0 overflow-hidden sm:h-60 sm:w-60">
              <DotLottieReact
                src="/success/success2.lottie"
                autoplay
                loop={false}
                speed={0.5}
                className="h-full w-full scale-100"
              />
            </div>
            <div className="flex max-w-md flex-col items-center gap-3 text-center sm:-ml-2 sm:items-start sm:text-left">
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold tracking-tight">
                  {isEdit
                    ? "Cập nhật đội nhóm thành công"
                    : "Tạo đội nhóm thành công"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isEdit
                    ? "Thông tin và thành viên đội nhóm đã được lưu."
                    : "Đội nhóm mới đã sẵn sàng để sử dụng."}
                </p>
              </div>
              <Button type="button" onClick={handleBackToList}>
                Về danh sách
              </Button>
            </div>
          </div>
        </Step>
      </Stepper>
    </div>
  );
}
