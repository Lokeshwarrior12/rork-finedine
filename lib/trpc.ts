// lib/trpc.ts
// Stub file for tRPC client - provides mock implementations until backend is ready

import { useMutation, useQuery } from '@tanstack/react-query';

type MutationOptions<TInput, TOutput> = {
  onSuccess?: (data: TOutput) => void;
  onError?: (error: Error) => void;
};

function createMockMutation<TInput, TOutput>(
  mockFn: (input: TInput) => Promise<TOutput>
) {
  return {
    useMutation: (options?: MutationOptions<TInput, TOutput>) => {
      return useMutation({
        mutationFn: mockFn,
        onSuccess: options?.onSuccess,
        onError: options?.onError,
      });
    },
  };
}

function createMockQuery<TOutput>(mockFn: () => Promise<TOutput>) {
  return {
    useQuery: () => {
      return useQuery({
        queryKey: ['mock'],
        queryFn: mockFn,
      });
    },
  };
}

export const trpc = {
  auth: {
    sendVerificationCode: createMockMutation<{ email: string }, { code: string }>(
      async ({ email }) => {
        console.log('[Mock] Sending verification code to:', email);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('[Mock] Generated code:', code);
        return { code };
      }
    ),
    verifyCode: createMockMutation<{ email: string; code: string }, { success: boolean }>(
      async ({ email, code }) => {
        console.log('[Mock] Verifying code for:', email, code);
        await new Promise((resolve) => setTimeout(resolve, 500));
        return { success: true };
      }
    ),
  },
  restaurants: {
    getAll: createMockQuery(async () => {
      return [];
    }),
    getById: createMockQuery(async () => {
      return null;
    }),
  },
  orders: {
    getAll: createMockQuery(async () => {
      return [];
    }),
  },
};

export type AppRouter = typeof trpc;
