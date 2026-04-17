import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { reducer, toast, useToast } from "@/hooks/use-toast";

describe("useToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("reducer handles add, update, dismiss and remove actions", () => {
    const addedState = reducer(
      {
        toasts: [
          { id: "older", title: "Older", open: true },
          { id: "oldest", title: "Oldest", open: true },
        ],
      },
      {
        type: "ADD_TOAST",
        toast: { id: "newest", title: "Newest", open: true },
      }
    );

    expect(addedState.toasts).toEqual([
      expect.objectContaining({ id: "newest", title: "Newest" }),
    ]);

    const updatedState = reducer(
      {
        toasts: [
          { id: "existing", title: "Old title", open: true },
          { id: "other", title: "Other title", open: true },
        ],
      },
      {
        type: "UPDATE_TOAST",
        toast: { id: "existing", title: "New title" },
      }
    );

    expect(updatedState.toasts[0]).toMatchObject({
      id: "existing",
      title: "New title",
    });
    expect(updatedState.toasts[1]).toMatchObject({
      id: "other",
      title: "Other title",
    });

    const dismissedSingle = reducer(
      {
        toasts: [
          { id: "first", open: true },
          { id: "second", open: true },
        ],
      },
      {
        type: "DISMISS_TOAST",
        toastId: "first",
      }
    );

    expect(dismissedSingle.toasts[0]).toMatchObject({
      id: "first",
      open: false,
    });
    expect(dismissedSingle.toasts[1]).toMatchObject({
      id: "second",
      open: true,
    });

    vi.runOnlyPendingTimers();

    reducer(
      {
        toasts: [{ id: "queued", open: true }],
      },
      {
        type: "DISMISS_TOAST",
        toastId: "queued",
      }
    );

    expect(vi.getTimerCount()).toBe(1);

    reducer(
      {
        toasts: [{ id: "queued", open: true }],
      },
      {
        type: "DISMISS_TOAST",
        toastId: "queued",
      }
    );

    expect(vi.getTimerCount()).toBe(1);

    const dismissedAll = reducer(
      {
        toasts: [
          { id: "one", open: true },
          { id: "two", open: true },
        ],
      },
      {
        type: "DISMISS_TOAST",
      }
    );

    expect(dismissedAll.toasts).toEqual([
      expect.objectContaining({ id: "one", open: false }),
      expect.objectContaining({ id: "two", open: false }),
    ]);

    expect(
      reducer(
        {
          toasts: [{ id: "single", open: false }],
        },
        {
          type: "REMOVE_TOAST",
          toastId: "single",
        }
      )
    ).toEqual({ toasts: [] });

    expect(
      reducer(
        {
          toasts: [
            { id: "single", open: false },
            { id: "other", open: false },
          ],
        },
        {
          type: "REMOVE_TOAST",
        }
      )
    ).toEqual({ toasts: [] });
  });

  test("exposes toast helpers through the hook and removes dismissed toasts", async () => {
    const { result, unmount } = renderHook(() => useToast());

    let controls:
      | {
          id: string;
          dismiss: () => void;
          update: (props: Record<string, unknown>) => void;
        }
      | undefined;

    act(() => {
      controls = toast({
        title: "Saved",
        description: "Done",
      });
    });

    expect(result.current.toasts).toHaveLength(1);

    expect(result.current.toasts[0]).toMatchObject({
      id: controls?.id,
      title: "Saved",
      description: "Done",
      open: true,
    });

    act(() => {
      controls?.update({
        title: "Updated",
      });
    });

    expect(result.current.toasts[0]).toMatchObject({
      title: "Updated",
    });

    act(() => {
      result.current.toasts[0].onOpenChange?.(true);
    });

    expect(result.current.toasts[0]).toMatchObject({
      open: true,
    });

    act(() => {
      result.current.toasts[0].onOpenChange?.(false);
    });

    expect(result.current.toasts[0]).toMatchObject({
      open: false,
    });

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(result.current.toasts).toEqual([]);

    act(() => {
      toast({
        title: "Dismiss all",
      });
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.toasts[0]).toMatchObject({
      open: false,
    });

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(result.current.toasts).toEqual([]);

    unmount();
  });
});
