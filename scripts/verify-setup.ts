import { supabaseAdmin } from '../lib/supabase'
import { createEmbedding } from '../lib/openai'

/**
 * Verification script to test the vector database setup
 * Run with: npm run verify (add to package.json) or: tsx scripts/verify-setup.ts
 */

async function verifySetup() {
  console.log('🔍 Verifying Legal AI Assistant setup...\n')

  // 1. Check Supabase connection
  console.log('1. Testing Supabase connection...')
  try {
    const { data, error } = await supabaseAdmin
      .from('legal_documents')
      .select('count')
      .limit(1)

    if (error) throw error
    console.log('   ✅ Supabase connection successful\n')
  } catch (error) {
    console.error('   ❌ Supabase connection failed:', error)
    return
  }

  // 2. Check if table exists and has data
  console.log('2. Checking legal_documents table...')
  try {
    const { data, error, count } = await supabaseAdmin
      .from('legal_documents')
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    console.log(`   ✅ Table exists with ${count || 0} documents\n`)
  } catch (error) {
    console.error('   ❌ Table check failed:', error)
    return
  }

  // 3. Check if documents have embeddings
  console.log('3. Checking for embeddings...')
  try {
    const { data, error } = await supabaseAdmin
      .from('legal_documents')
      .select('id, title, embedding')
      .not('embedding', 'is', null)
      .limit(5)

    if (error) throw error
    console.log(`   ✅ Found ${data?.length || 0} documents with embeddings\n`)
  } catch (error) {
    console.error('   ❌ Embedding check failed:', error)
    return
  }

  // 4. Test vector search function
  console.log('4. Testing vector search function...')
  try {
    const testEmbedding = await createEmbedding('test query')
    const { data, error } = await supabaseAdmin.rpc('match_legal_documents', {
      query_embedding: testEmbedding,
      match_count: 3,
    })

    if (error) throw error
    console.log(`   ✅ Vector search function works (found ${data?.length || 0} results)\n`)
  } catch (error) {
    console.error('   ❌ Vector search test failed:', error)
    return
  }

  // 5. Test OpenAI connection
  console.log('5. Testing OpenAI API...')
  try {
    const embedding = await createEmbedding('test')
    if (embedding.length === 1536) {
      console.log('   ✅ OpenAI API connection successful\n')
    } else {
      console.error(`   ❌ Unexpected embedding dimension: ${embedding.length}`)
      return
    }
  } catch (error) {
    console.error('   ❌ OpenAI API test failed:', error)
    return
  }

  console.log('🎉 All checks passed! Your setup is ready.\n')
  console.log('Next steps:')
  console.log('  1. Run: npm run dev')
  console.log('  2. Open: http://localhost:3000')
  console.log('  3. Start asking legal questions!')
}

verifySetup().catch(console.error)

