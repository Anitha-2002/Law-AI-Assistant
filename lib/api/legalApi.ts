import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export interface AskQuestionRequest {
  question: string
}

export interface Source {
  id: string
  title: string
  type: string
  similarity: number
}

export interface AskQuestionResponse {
  answer: string
  sources: Source[]
}

export const legalApi = createApi({
  reducerPath: 'legalApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
  }),
  tagTypes: ['Legal'],
  endpoints: (builder) => ({
    askQuestion: builder.mutation<AskQuestionResponse, AskQuestionRequest>({
      query: (body) => ({
        url: '/ask',
        method: 'POST',
        body,
      }),
    }),
  }),
})

export const { useAskQuestionMutation } = legalApi

