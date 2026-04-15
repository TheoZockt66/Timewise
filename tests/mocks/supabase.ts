import { vi } from "vitest";

type QueryPhase = "await" | "single" | "maybeSingle";
type QueryAction = "select" | "insert" | "update" | "delete";

type SupabaseResult<T = unknown> = {
  data: T | null;
  error: { message: string } | null;
};

type TableActionConfig = Partial<Record<QueryPhase, SupabaseResult[]>>;
type TableConfig = Partial<Record<QueryAction, TableActionConfig>>;

type AuthUser = { id: string } | null;
type GetUserResponse = {
  data: { user: AuthUser };
  error: null;
};

type SupabaseMockOptions = {
  user?: AuthUser;
  getUserResponses?: GetUserResponse[];
  tables?: Record<string, TableConfig>;
  auth?: Partial<{
    getUser: ReturnType<typeof vi.fn>;
    signInWithPassword: ReturnType<typeof vi.fn>;
    signUp: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
    resetPasswordForEmail: ReturnType<typeof vi.fn>;
    exchangeCodeForSession: ReturnType<typeof vi.fn>;
  }>;
};

function nextResult(
  config: TableConfig,
  action: QueryAction,
  phase: QueryPhase
): SupabaseResult {
  const queue = config[action]?.[phase];

  if (queue && queue.length > 0) {
    return queue.shift()!;
  }

  return { data: null, error: null };
}

class QueryBuilderMock {
  private action: QueryAction = "select";

  constructor(private readonly config: TableConfig) {}

  select = vi.fn((_columns?: string) => {
    if (this.action === "select") {
      this.action = "select";
    }
    return this;
  });

  insert = vi.fn((_payload?: unknown) => {
    this.action = "insert";
    return this;
  });

  update = vi.fn((_payload?: unknown) => {
    this.action = "update";
    return this;
  });

  delete = vi.fn(() => {
    this.action = "delete";
    return this;
  });

  eq = vi.fn((_column?: string, _value?: unknown) => this);
  gte = vi.fn((_column?: string, _value?: unknown) => this);
  lte = vi.fn((_column?: string, _value?: unknown) => this);
  gt = vi.fn((_column?: string, _value?: unknown) => this);
  in = vi.fn((_column?: string, _values?: unknown[]) => this);
  order = vi.fn((_column?: string, _options?: unknown) => this);

  single = vi.fn(async () => nextResult(this.config, this.action, "single"));
  maybeSingle = vi.fn(async () => nextResult(this.config, this.action, "maybeSingle"));

  then<TResult1 = SupabaseResult, TResult2 = never>(
    onfulfilled?:
      | ((value: SupabaseResult) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return Promise.resolve(nextResult(this.config, this.action, "await")).then(
      onfulfilled ?? undefined,
      onrejected ?? undefined
    );
  }
}

export function createSupabaseResult<T>(
  data: T | null,
  errorMessage?: string
): SupabaseResult<T> {
  return {
    data,
    error: errorMessage ? { message: errorMessage } : null,
  };
}

export function createSupabaseClientMock(options: SupabaseMockOptions = {}) {
  const tableCalls = new Map<string, QueryBuilderMock[]>();
  const tableConfig = options.tables ?? {};
  const queuedUsers = [...(options.getUserResponses ?? [])];

  const getUser =
    options.auth?.getUser ??
    vi.fn(async () =>
      queuedUsers.shift() ?? {
        data: { user: options.user ?? null },
        error: null,
      }
    );

  const auth = {
    getUser,
    signInWithPassword:
      options.auth?.signInWithPassword ??
      vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signUp:
      options.auth?.signUp ??
      vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signOut: options.auth?.signOut ?? vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail:
      options.auth?.resetPasswordForEmail ??
      vi.fn().mockResolvedValue({ data: null, error: null }),
    exchangeCodeForSession:
      options.auth?.exchangeCodeForSession ??
      vi.fn().mockResolvedValue({ error: null }),
  };

  const from = vi.fn((table: string) => {
    const builder = new QueryBuilderMock(tableConfig[table] ?? {});
    const existingCalls = tableCalls.get(table) ?? [];

    existingCalls.push(builder);
    tableCalls.set(table, existingCalls);

    return builder;
  });

  return {
    client: {
      auth,
      from,
    },
    auth,
    from,
    getTableCalls: (table: string) => tableCalls.get(table) ?? [],
  };
}
