import { appendFileSync, existsSync } from "fs";
import { resolve } from "path";
// #region agent log
try {
  appendFileSync(
    "/Users/anitha/Documents/Anitha Business/Law-AI-Assistant/.cursor/debug.log",
    JSON.stringify({
      location: "scripts/ingest.ts:6",
      message: "Script entry - checking env vars after load-env import",
      data: {
        envPath: resolve(process.cwd(), ".env.local"),
        envFileExists: existsSync(resolve(process.cwd(), ".env.local")),
        hasNextPublicSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasOpenaiApiKey: !!process.env.OPENAI_API_KEY,
        allEnvKeys: Object.keys(process.env)
          .filter((k) => k.includes("SUPABASE") || k.includes("OPENAI"))
          .sort(),
      },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "post-fix",
      hypothesisId: "A,B,C,E",
    }) + "\n"
  );
} catch (e) {}
// #endregion
import { supabaseAdmin } from "../lib/supabase";
// #region agent log
try {
  appendFileSync(
    "/Users/anitha/Documents/Anitha Business/Law-AI-Assistant/.cursor/debug.log",
    JSON.stringify({
      location: "scripts/ingest.ts:7",
      message: "After supabase import - checking if error occurred",
      data: { imported: !!supabaseAdmin },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "post-fix",
      hypothesisId: "D",
    }) + "\n"
  );
} catch (e) {}
// #endregion
import { createEmbedding } from "../lib/openai";

// Sample data: 5 lawyers, 5 cases, 5 articles
const sampleData = [
  // Lawyers
  {
    title: "Sarah Chen",
    content:
      "Sarah Chen is a California-based lawyer specializing in environmental law and regulatory compliance. She has over 15 years of experience representing clients in EPA matters, water rights disputes, and climate change litigation. Sarah graduated from Stanford Law School and is a member of the California State Bar.",
    type: "lawyer",
  },
  {
    title: "Michael Rodriguez",
    content:
      "Michael Rodriguez is a corporate attorney in New York City focusing on mergers and acquisitions, securities law, and corporate governance. He has represented Fortune 500 companies in transactions worth over $50 billion. Michael is a partner at Rodriguez & Associates and holds a JD from Harvard Law School.",
    type: "lawyer",
  },
  {
    title: "Emily Watson",
    content:
      "Emily Watson is a criminal defense attorney in Chicago with expertise in white-collar crime, federal criminal defense, and appellate practice. She has successfully defended clients in high-profile cases and has a 90% acquittal rate. Emily is a former federal prosecutor and graduated from University of Chicago Law School.",
    type: "lawyer",
  },
  {
    title: "David Kim",
    content:
      "David Kim is an intellectual property lawyer in Seattle specializing in patent law, trademark disputes, and technology licensing. He represents tech startups and established companies in patent litigation and IP portfolio management. David has a background in computer science and a JD from University of Washington.",
    type: "lawyer",
  },
  {
    title: "Jennifer Martinez",
    content:
      "Jennifer Martinez is a family law attorney in Miami handling divorce, child custody, adoption, and domestic violence cases. She is known for her compassionate approach and has helped over 500 families navigate difficult legal situations. Jennifer is certified in family law mediation and graduated from University of Miami School of Law.",
    type: "lawyer",
  },
  // Cases
  {
    title: "State v. Environmental Corp (2023)",
    content:
      "In this landmark environmental case, Environmental Corp was sued by the State of California for violating the Clean Water Act by discharging pollutants into state waterways. The case resulted in a $25 million settlement and required the company to implement comprehensive environmental monitoring systems. The case set a precedent for corporate environmental accountability.",
    type: "case",
  },
  {
    title: "TechStart Inc. v. BigTech Corp (2022)",
    content:
      "A patent infringement case where TechStart Inc. alleged that BigTech Corp violated three of its software patents related to cloud computing infrastructure. After a two-year legal battle, the jury awarded TechStart $150 million in damages. The case highlighted the importance of early patent filing for startups in the technology sector.",
    type: "case",
  },
  {
    title: "Smith v. National Bank (2023)",
    content:
      "A class-action securities fraud case involving National Bank's misleading statements about its financial health. The case settled for $300 million, with thousands of shareholders receiving compensation. This case led to new SEC regulations requiring more transparent financial disclosures from major financial institutions.",
    type: "case",
  },
  {
    title: "Johnson Family Custody Dispute (2022)",
    content:
      "A complex child custody case involving international jurisdiction between the United States and Canada. The court ruled in favor of joint custody with the child spending school years in the US and summers in Canada. The case established new guidelines for cross-border custody arrangements and parental rights.",
    type: "case",
  },
  {
    title: "City of Portland v. Manufacturing Co. (2023)",
    content:
      "A corporate liability case where Manufacturing Co. was found responsible for groundwater contamination affecting over 1,000 residents. The company was ordered to pay $75 million in damages and fund a comprehensive cleanup effort. The case strengthened environmental liability laws at the state level.",
    type: "case",
  },
  // Articles
  {
    title: "Understanding RICO: A Guide to Federal Racketeering Laws",
    content:
      "The Racketeer Influenced and Corrupt Organizations Act (RICO) is a federal law designed to combat organized crime. This article explains how RICO can be applied to prosecute individuals and organizations engaged in patterns of illegal activity. Key elements include proving a pattern of racketeering activity and showing how the organization was used to commit crimes. Recent cases have expanded RICO's application beyond traditional organized crime to include white-collar offenses.",
    type: "article",
  },
  {
    title: "The Future of AI in Legal Practice",
    content:
      "Artificial intelligence is transforming legal practice through document review, legal research, and contract analysis. This article explores how AI tools are being used by law firms to increase efficiency and reduce costs. However, ethical considerations around AI-generated legal advice and the need for human oversight remain critical. The legal profession must adapt to these technological changes while maintaining professional standards.",
    type: "article",
  },
  {
    title: "Employment Law Update: Remote Work Regulations",
    content:
      "As remote work becomes permanent for many companies, employment law must adapt. This article covers key legal considerations including wage and hour compliance across state lines, workers' compensation for home offices, and data privacy requirements. Employers must navigate complex state and federal regulations when managing remote teams. Recent court decisions have clarified some ambiguities but many questions remain unresolved.",
    type: "article",
  },
  {
    title: "Intellectual Property Protection for Startups",
    content:
      "Startups must protect their intellectual property from day one. This article outlines strategies for patent filing, trademark registration, and trade secret protection. Key considerations include timing of patent applications, choosing between provisional and non-provisional patents, and understanding the costs involved. Early IP protection can be crucial for securing funding and preventing competitors from copying innovations.",
    type: "article",
  },
  {
    title: "Criminal Law Reform: Recent Changes to Sentencing Guidelines",
    content:
      "Recent criminal law reforms have focused on reducing mandatory minimum sentences and expanding alternatives to incarceration. This article examines how these changes affect defendants, prosecutors, and the justice system. Key reforms include expanded use of diversion programs, changes to drug offense sentencing, and increased focus on rehabilitation. These reforms aim to address mass incarceration while maintaining public safety.",
    type: "article",
  },
];

async function ingestData() {
  console.log("Starting data ingestion...");
  console.log(`Processing ${sampleData.length} documents...`);
  console.log(
    "⚠️  Note: Make sure embeddings are created successfully (not hash-based) for semantic search to work.\n"
  );

  // Clear existing data first to avoid duplicates
  console.log("Clearing existing documents...");
  const { error: deleteError } = await supabaseAdmin
    .from("legal_documents")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

  if (deleteError) {
    console.warn(
      "Warning: Could not clear existing data:",
      deleteError.message
    );
  } else {
    console.log("✓ Cleared existing documents\n");
  }

  for (const doc of sampleData) {
    try {
      console.log(`Processing: ${doc.title} (${doc.type})`);

      // Create embedding
      const embedding = await createEmbedding(`${doc.title}\n\n${doc.content}`);

      if (!embedding || embedding.length !== 1536) {
        console.error(
          `⚠️  WARNING: Invalid embedding for ${doc.title} (length: ${
            embedding?.length || 0
          })`
        );
      }

      // Insert into Supabase
      const { data, error } = await supabaseAdmin
        .from("legal_documents")
        .insert({
          title: doc.title,
          content: doc.content,
          type: doc.type,
          embedding: embedding,
        })
        .select();

      if (error) {
        console.error(`Error inserting ${doc.title}:`, error);
      } else {
        console.log(`✓ Successfully inserted: ${doc.title}`);
      }
    } catch (error) {
      console.error(`Error processing ${doc.title}:`, error);
    }
  }

  console.log("\n✓ Data ingestion complete!");
  console.log(
    "⚠️  If you see hash-based embedding warnings above, semantic search will not work properly."
  );
}

// Run ingestion
ingestData().catch(console.error);
