'use client'

import { useState } from 'react'
import { useAskQuestionMutation } from '@/lib/api/legalApi'

export default function Home() {
  const [question, setQuestion] = useState('')
  const [askQuestion, { data, isLoading, error }] = useAskQuestionMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    try {
      await askQuestion({ question: question.trim() }).unwrap()
    } catch (err) {
      console.error('Error asking question:', err)
    }
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-font-primary mb-2">
            Legal AI Assistant
          </h1>
          <p className="text-base sm:text-lg text-font-secondary">
            Ask questions about lawyers, cases, and legal topics
          </p>
        </header>

        {/* Main Content */}
        <div className="bg-bg-primary rounded-lg shadow-lg p-6 sm:p-8">
          {/* Input Form */}
          <form onSubmit={handleSubmit} className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a legal question..."
                className="flex-1 px-4 py-3 sm:py-4 border border-border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent text-font-primary bg-bg-primary"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !question.trim()}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-bg-primary-blue text-white rounded-lg font-semibold hover:bg-primary-blue-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {isLoading ? 'Asking...' : 'Ask'}
              </button>
            </div>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-font-red text-sm sm:text-base">
                Error: {error && 'data' in error
                  ? JSON.stringify(error.data)
                  : 'Failed to get answer. Please try again.'}
              </p>
            </div>
          )}

          {/* AI Response */}
          {data && (
            <div className="space-y-6">
              {/* Answer */}
              <div className="bg-bg-secondary rounded-lg p-5 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-font-primary mb-3 sm:mb-4">
                  Answer
                </h2>
                <p className="text-base sm:text-lg text-font-primary leading-relaxed whitespace-pre-wrap">
                  {data.answer}
                </p>
              </div>

              {/* Sources */}
              {data.sources && data.sources.length > 0 && (
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-font-primary mb-3 sm:mb-4">
                    Sources
                  </h2>
                  <div className="space-y-3">
                    {data.sources.map((source) => (
                      <div
                        key={source.id}
                        className="bg-bg-secondary rounded-lg p-4 sm:p-5 border border-border-gray"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-font-primary">
                            {source.title}
                          </h3>
                          <span className="inline-block px-3 py-1 bg-primary-blue-light text-white text-xs sm:text-sm rounded-full capitalize">
                            {source.type}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-font-secondary">
                          Similarity: {(source.similarity * 100).toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!data && !isLoading && !error && (
            <div className="text-center py-8 sm:py-12">
              <p className="text-font-secondary text-base sm:text-lg">
                Enter a question above to get started
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 sm:mt-12 text-center text-sm text-font-secondary">
          <p>Powered by OpenAI GPT-4 and Supabase pgvector</p>
        </footer>
      </div>
    </div>
  )
}

