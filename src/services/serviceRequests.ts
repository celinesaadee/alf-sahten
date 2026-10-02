import { supabase } from "../lib/supabase";

export type ServiceRequestStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "completed"
  | "cancelled";

export type ServiceRequestInput = {
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  requestedDate: string;
  location: string;
  budget?: number | null;
  budgetCurrency?: string | null;
  message?: string | null;
};

export type ServiceRequest = {
  id: string;
  customer_id: string;
  cook_id: string;
  service_id: string;
  service_title: string;

  customer_name: string;
  customer_email: string;
  customer_phone: string | null;

  requested_date: string;
  location: string;

  budget: number | null;
  budget_currency: string | null;

  message: string;

  status: ServiceRequestStatus;

  created_at: string;
  updated_at: string;
};

async function currentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error(
      "You must be signed in to continue.",
    );
  }

  return user.id;
}

function prepareServiceRequest(
  input: ServiceRequestInput,
) {
  const serviceId =
    input.serviceId.trim();

  const customerName =
    input.customerName.trim();

  const customerEmail =
    input.customerEmail
      .trim()
      .toLowerCase();

  const customerPhone =
    input.customerPhone?.trim() ||
    null;

  const requestedDate =
    input.requestedDate.trim();

  const location =
    input.location.trim();

  const message =
    input.message?.trim() ?? "";

  const budget =
    input.budget === null ||
    input.budget === undefined
      ? null
      : Number(input.budget);

  const budgetCurrency =
    input.budgetCurrency
      ?.trim()
      .toUpperCase() || null;

  if (!serviceId) {
    throw new Error(
      "A service is required.",
    );
  }

  if (
    customerName.length < 1 ||
    customerName.length > 120
  ) {
    throw new Error(
      "Enter a valid name.",
    );
  }

  if (
    customerEmail.length < 3 ||
    customerEmail.length > 254 ||
    !customerEmail.includes("@")
  ) {
    throw new Error(
      "Enter a valid email address.",
    );
  }

  if (
    customerPhone &&
    customerPhone.length > 40
  ) {
    throw new Error(
      "Phone number is too long.",
    );
  }

  if (!requestedDate) {
    throw new Error(
      "Choose a requested date.",
    );
  }

  const requested = new Date(
    `${requestedDate}T12:00:00`,
  );

  if (
    Number.isNaN(
      requested.getTime(),
    )
  ) {
    throw new Error(
      "Choose a valid requested date.",
    );
  }

  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  if (requested < today) {
    throw new Error(
      "The requested date cannot be in the past.",
    );
  }

  if (
    location.length < 1 ||
    location.length > 250
  ) {
    throw new Error(
      "Enter a valid location.",
    );
  }

  if (
    budget !== null &&
    (!Number.isFinite(budget) ||
      budget < 0)
  ) {
    throw new Error(
      "Enter a valid budget.",
    );
  }

  if (
    budget !== null &&
    !budgetCurrency
  ) {
    throw new Error(
      "Choose a currency.",
    );
  }

  if (
    budgetCurrency &&
    !/^[A-Z]{3}$/.test(
      budgetCurrency,
    )
  ) {
    throw new Error(
      "Choose a valid currency.",
    );
  }

  if (message.length > 1500) {
    throw new Error(
      "Message cannot exceed 1500 characters.",
    );
  }

  return {
    service_id: serviceId,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    requested_date: requestedDate,
    location,
    budget,
    budget_currency:
      budget === null
        ? null
        : budgetCurrency,
    message,
  };
}

export async function createServiceRequest(
  input: ServiceRequestInput,
): Promise<ServiceRequest> {
  await currentUserId();

  const payload =
    prepareServiceRequest(input);

  const { data, error } =
    await supabase
      .from("service_requests")
      .insert(payload)
      .select("*")
      .single();

  if (error) {
    throw error;
  }

  return data as ServiceRequest;
}

export async function getMyServiceRequests(): Promise<
  ServiceRequest[]
> {
  const userId =
    await currentUserId();

  const { data, error } =
    await supabase
      .from("service_requests")
      .select("*")
      .eq(
        "customer_id",
        userId,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      );

  if (error) {
    throw error;
  }

  return (
    data ?? []
  ) as ServiceRequest[];
}

export async function getCookServiceRequests(): Promise<
  ServiceRequest[]
> {
  const userId =
    await currentUserId();

  const { data, error } =
    await supabase
      .from("service_requests")
      .select("*")
      .eq(
        "cook_id",
        userId,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      );

  if (error) {
    throw error;
  }

  return (
    data ?? []
  ) as ServiceRequest[];
}

export async function getServiceRequest(
  requestId: string,
): Promise<ServiceRequest | null> {
  await currentUserId();

  const { data, error } =
    await supabase
      .from("service_requests")
      .select("*")
      .eq(
        "id",
        requestId,
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  return (
    data as ServiceRequest | null
  );
}

export async function updateCookServiceRequestStatus(
  requestId: string,
  status:
    | "accepted"
    | "declined"
    | "completed",
): Promise<ServiceRequest> {
  const userId =
    await currentUserId();

  const expectedStatus =
    status === "completed"
      ? "accepted"
      : "pending";

  const { data, error } =
    await supabase
      .from("service_requests")
      .update({
        status,
      })
      .eq(
        "id",
        requestId,
      )
      .eq(
        "cook_id",
        userId,
      )
      .eq(
        "status",
        expectedStatus,
      )
      .select("*")
      .single();

  if (error) {
    throw error;
  }

  return data as ServiceRequest;
}

export async function cancelMyServiceRequest(
  requestId: string,
): Promise<ServiceRequest> {
  const userId =
    await currentUserId();

  const { data, error } =
    await supabase
      .from("service_requests")
      .update({
        status: "cancelled",
      })
      .eq(
        "id",
        requestId,
      )
      .eq(
        "customer_id",
        userId,
      )
      .in(
        "status",
        [
          "pending",
          "accepted",
        ],
      )
      .select("*")
      .single();

  if (error) {
    throw error;
  }

  return data as ServiceRequest;
}
