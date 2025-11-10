/**
 * Hardcoded Knowledge Base for x402 Answers (Solana-only)
 * 4 topics × 10 questions each = 40 total
 * Beginner-friendly, with short code snippets where helpful.
 */

export type Topic =
  | "Solana Basics"
  | "Anchor Basics"
  | "PDAs & Programs"
  | "Transactions & Troubleshooting";

export interface QuizOption {
  id: string;
  text: string;
  correct: boolean;
}

export interface KBEntry {
  id: string;
  topic: Topic;
  q: string;
  aMd: string; // 6–10 simple lines; first line is a preview sentence
  quizOptions?: QuizOption[]; // 4 options minimum
  explanationShort?: string; // 1–2 sentences for correct answers
  explanationFull?: string; // 2–5 bullets + example for wrong answers
}

export const KNOWLEDGE: KBEntry[] = [
  // =========================
  // 1) Solana Basics (10)
  // =========================
  {
    id: "sb-accounts",
    topic: "Solana Basics",
    q: "What is a Solana account?",
    aMd: `A Solana account is on-chain storage with an address and an owner.
It can hold data or lamports (SOL) and is controlled by an owner program.
Wallets control normal system accounts; programs own data accounts.
Every read/write happens through accounts passed to an instruction.
Think: account = row of state on-chain, not a web2 login.

Example: create a system account in TS
\`\`\`ts
SystemProgram.createAccount({ fromPubkey, newAccountPubkey, space, lamports, programId })
\`\`\``,
    quizOptions: [
      { id: "a", text: "On-chain storage identified by an address and owned by a program", correct: true },
      { id: "b", text: "A browser extension wallet app", correct: false },
      { id: "c", text: "A validator server machine", correct: false },
      { id: "d", text: "An off-chain database row in RPC", correct: false },
    ],
    explanationShort: "Accounts are on-chain storage slots with an owner (usually a program).",
    explanationFull: `• Store data or lamports on-chain\n• Owned by a program id\n• Must be passed to instructions\n• Created via SystemProgram or CPIs`,
  },
  {
    id: "sb-program",
    topic: "Solana Basics",
    q: "What is a Solana program?",
    aMd: `A program is deployed on-chain code that executes when called.
It is stateless between calls; all state lives in accounts.
Programs validate and modify accounts they receive.
You reference a program by its program id (public key).

Example: calling a program instruction
\`\`\`ts
new Transaction().add(new TransactionInstruction({ programId, keys, data }))
\`\`\``,
    quizOptions: [
      { id: "a", text: "Deployed on-chain code that runs when an instruction calls it", correct: true },
      { id: "b", text: "A CLI tool used by validators", correct: false },
      { id: "c", text: "A wallet recovery phrase", correct: false },
      { id: "d", text: "A web server hosting RPCs", correct: false },
    ],
    explanationShort: "Programs are executable code on-chain; state stays in accounts.",
    explanationFull: `• Identified by a program id\n• Executes when included in a transaction\n• Reads/writes accounts passed in\n• No global mutable variables`,
  },
  {
    id: "sb-instruction",
    topic: "Solana Basics",
    q: "What is a Solana instruction?",
    aMd: `An instruction names a program and passes accounts + data.
It declares which accounts are read/write and which must sign.
Data encodes which action to run and with what params.
Transactions can bundle multiple instructions in order.

Shape in TS
\`\`\`ts
new TransactionInstruction({ programId, keys: [{pubkey,isSigner,isWritable}], data })
\`\`\``,
    quizOptions: [
      { id: "a", text: "A call to a program with specific accounts and data", correct: true },
      { id: "b", text: "A SOL transfer only", correct: false },
      { id: "c", text: "A validator gossip message", correct: false },
      { id: "d", text: "An RPC endpoint URL", correct: false },
    ],
    explanationShort: "Instruction = which program, which accounts, what data.",
    explanationFull: `• Accounts mark R/W + signer\n• Encodes action + params\n• Multiple per transaction\n• Order matters`,
  },
  {
    id: "sb-transaction",
    topic: "Solana Basics",
    q: "What is a Solana transaction?",
    aMd: `A transaction is a signed bundle of one or more instructions.
If any instruction fails, the whole transaction fails (atomic).
Signatures authorize account changes and fee payment.
Blockhash + signatures make it unique and recent.

Create & send in TS
\`\`\`ts
const tx = new Transaction().add(ix1, ix2)
await sendAndConfirmTransaction(connection, tx, [payer])
\`\`\``,
    quizOptions: [
      { id: "a", text: "A signed bundle of instructions that executes atomically", correct: true },
      { id: "b", text: "A message sent between validators", correct: false },
      { id: "c", text: "A smart contract deployment only", correct: false },
      { id: "d", text: "A browser request to an RPC server", correct: false },
    ],
    explanationShort: "Transactions group instructions; all-or-nothing.",
    explanationFull: `• Requires recent blockhash\n• Requires signatures\n• Pays fees in SOL\n• Fails entirely if one step fails`,
  },
  {
    id: "sb-lamports",
    topic: "Solana Basics",
    q: "What are lamports?",
    aMd: `Lamports are the smallest unit of SOL (like cents for dollars).
1 SOL = 1,000,000,000 lamports (1e9).
Rent and fees are paid in lamports.
Amounts in code generally use u64 lamports.

TS helper
\`\`\`ts
const LAMPORTS_PER_SOL = 1_000_000_000
\`\`\``,
    quizOptions: [
      { id: "a", text: "The smallest unit of SOL used for fees and rent", correct: true },
      { id: "b", text: "A special PDA for fees", correct: false },
      { id: "c", text: "A validator vote unit", correct: false },
      { id: "d", text: "A token from Token-2022", correct: false },
    ],
    explanationShort: "Lamports are the atomic unit of SOL; 1 SOL = 1e9 lamports.",
    explanationFull: `• Used for fees/rent\n• Represented as integers\n• Avoid float math\n• Convert with LAMPORTS_PER_SOL`,
  },
  {
    id: "sb-rent",
    topic: "Solana Basics",
    q: "What does rent-exempt mean?",
    aMd: `Accounts must hold a minimum lamports balance to stay alive.
If they have at least the network's minimum, they're rent-exempt.
When you \"init\" or create, fund enough lamports for space.
Resize (realloc) may change the rent requirement.

Client check
\`\`\`ts
connection.getMinimumBalanceForRentExemption(space)
\`\`\``,
    quizOptions: [
      { id: "a", text: "The account holds enough lamports so it won’t be reclaimed", correct: true },
      { id: "b", text: "The account never pays any fees", correct: false },
      { id: "c", text: "The account is immune to program writes", correct: false },
      { id: "d", text: "The account becomes read-only", correct: false },
    ],
    explanationShort: "Fund enough lamports for the account’s size to avoid rent collection.",
    explanationFull: `• Depends on space size\n• Must be recalculated after realloc\n• Provide a payer\n• Common source of init failures`,
  },
  {
    id: "sb-system-program",
    topic: "Solana Basics",
    q: "What does the System Program do?",
    aMd: `The System Program creates, funds, and assigns accounts.
It transfers lamports and allocates space.
Other programs often call it during initialization.

Create account (Rust)
\`\`\`rust
system_instruction::create_account(&from, &new, lamports, space, &owner)
\`\`\``,
    quizOptions: [
      { id: "a", text: "Creates/assigns accounts and moves lamports", correct: true },
      { id: "b", text: "Mints SPL tokens", correct: false },
      { id: "c", text: "Upgrades programs", correct: false },
      { id: "d", text: "Indexes transactions for explorers", correct: false },
    ],
    explanationShort: "System Program handles basic account creation, assignment, and SOL transfers.",
    explanationFull: `• Fundamental CPI for init\n• Needs payer lamports\n• Assigns owner program id\n• Used by Anchor under the hood`,
  },
  {
    id: "sb-sysvars",
    topic: "Solana Basics",
    q: "What are sysvars?",
    aMd: `Sysvars are read-only accounts with cluster data (clock, rent, etc.).
Programs read sysvars to make time/rent/slot decisions.
They are provided like any other account in instructions.

Clock example (Rust)
\`\`\`rust
let now = Clock::get()?.unix_timestamp;
\`\`\``,
    quizOptions: [
      { id: "a", text: "Read-only accounts exposing cluster data like time and rent", correct: true },
      { id: "b", text: "A mutable storage area for programs", correct: false },
      { id: "c", text: "A local cache inside RPC", correct: false },
      { id: "d", text: "A web API for explorers", correct: false },
    ],
    explanationShort: "Sysvars are special accounts programs read for cluster parameters.",
    explanationFull: `• Clock, Rent, SlotHashes, etc.\n• Read-only\n• Passed as normal accounts\n• Avoids RPC dependency on-chain`,
  },
  {
    id: "sb-ata-intro",
    topic: "Solana Basics",
    q: "What is an Associated Token Account (ATA)?",
    aMd: `An ATA is the standard token account for (owner, mint).
It has a predictable address and simplifies UX.
Use the Associated Token Program to create if missing.

TS example
\`\`\`ts
getOrCreateAssociatedTokenAccount(connection, payer, mint, owner)
\`\`\``,
    quizOptions: [
      { id: "a", text: "A predictable token account for a wallet and a mint", correct: true },
      { id: "b", text: "A PDA owned by the System Program", correct: false },
      { id: "c", text: "A special SOL savings account", correct: false },
      { id: "d", text: "A metadata storage account", correct: false },
    ],
    explanationShort: "ATAs standardize token storage per (owner, mint).",
    explanationFull: `• Created via Associated Token Program\n• One per (owner, mint)\n• Improves wallet UX\n• Check existence before create`,
  },
  {
    id: "sb-signers",
    topic: "Solana Basics",
    q: "What counts as a signer in a transaction?",
    aMd: `Signers authorize changes or actions requiring approval.
A signer could be a wallet keypair or a PDA (via seeds).
In TS, include keypairs in sendAndConfirmTransaction.
For PDAs, provide signer seeds in CPI/Invoke.

TS snippet
\`\`\`ts
await sendAndConfirmTransaction(conn, tx, [payerKeypair])
\`\`\``,
    quizOptions: [
      { id: "a", text: "Keys that authorize actions: wallet signers or PDAs via seeds", correct: true },
      { id: "b", text: "Any account marked writable", correct: false },
      { id: "c", text: "All accounts in the instruction", correct: false },
      { id: "d", text: "Only the fee payer", correct: false },
    ],
    explanationShort: "Signers are explicit: wallets sign physically; PDAs sign via seeds.",
    explanationFull: `• Wallets sign with private keys\n• PDAs sign via program-derived seeds\n• Do not over-request signatures\n• Clarify required signers in UI`,
  },

  // =========================
  // 2) Anchor Basics (10)
  // =========================
  {
    id: "ab-context",
    topic: "Anchor Basics",
    q: "What is Context in Anchor?",
    aMd: `Context is the typed bundle of accounts your instruction uses.
Anchor validates ownership, signer, and mutability before your logic runs.
Access accounts with \`ctx.accounts\` inside handlers.

Rust
\`\`\`rust
pub fn do_stuff(ctx: Context<DoStuff>) -> Result<()> {
  let accs = &mut ctx.accounts;
  Ok(())
}
\`\`\``,
    quizOptions: [
      { id: "a", text: "A typed struct carrying validated accounts into your handler", correct: true },
      { id: "b", text: "A global mutable state object", correct: false },
      { id: "c", text: "A special PDA used by Anchor", correct: false },
      { id: "d", text: "A JSON IDL file", correct: false },
    ],
    explanationShort: "Context bundles accounts with checks applied before your code runs.",
    explanationFull: `• Use #[derive(Accounts)]\n• Access via ctx.accounts\n• Enforces signer/mutability/ownership\n• Fewer runtime surprises`,
  },
  {
    id: "ab-derive-accounts",
    topic: "Anchor Basics",
    q: "Why use #[derive(Accounts)]?",
    aMd: `It auto-validates that required accounts match your constraints.
You describe constraints in the struct; Anchor checks before executing.
This reduces manual owner/signer checks and improves UX.

Rust
\`\`\`rust
#[derive(Accounts)]
pub struct Create<'info> {
  #[account(mut)] pub payer: Signer<'info>,
  pub system_program: Program<'info, System>,
}
\`\`\``,
    quizOptions: [
      { id: "a", text: "Auto-validates account wiring and constraints before logic runs", correct: true },
      { id: "b", text: "Encrypts account data at rest", correct: false },
      { id: "c", text: "Generates wallets for tests", correct: false },
      { id: "d", text: "Improves Rust compile times", correct: false },
    ],
    explanationShort: "Saves manual checks; fails fast with clear messages.",
    explanationFull: `• Early failure on bad accounts\n• Type-safety for fields\n• Clear constraints\n• Better developer UX`,
  },
  {
    id: "ab-constraints",
    topic: "Anchor Basics",
    q: "How do constraints work in Anchor?",
    aMd: `Constraints are guardrails checked before your handler.
They verify owner, seeds, relations, sizes, and more.
Use has_one, seeds, bump, and relations for safety.

Rust
\`\`\`rust
#[account(has_one = authority, seeds=[b"STATE"], bump)]
pub state: Account<'info, State>,
\`\`\``,
    quizOptions: [
      { id: "a", text: "Pre-handler checks for owners, seeds, relations, and sizes", correct: true },
      { id: "b", text: "Optional checks that only run in tests", correct: false },
      { id: "c", text: "Compiler-only hints with no runtime effect", correct: false },
      { id: "d", text: "A way to reorder instructions", correct: false },
    ],
    explanationShort: "Constraints enforce invariants before code executes.",
    explanationFull: `• has_one enforces relationships\n• seeds+bump pin PDAs\n• size/realloc must match\n• Clear errors on failure`,
  },
  {
    id: "ab-init",
    topic: "Anchor Basics",
    q: "When to use init vs init_if_needed?",
    aMd: `Use \`init\` when the account must not exist yet.
Use \`init_if_needed\` when it may already exist.
Both allocate space, assign owner, and fund rent with a payer.
Be explicit with seeds and bump for deterministic PDAs.

Rust
\`\`\`rust
#[account(init, payer = payer, space = 8 + SIZE, seeds=[...], bump)]
\`\`\``,
    quizOptions: [
      { id: "a", text: "init = must not exist; init_if_needed = may exist already", correct: true },
      { id: "b", text: "init is for devnet; the other for mainnet", correct: false },
      { id: "c", text: "init makes read-only accounts", correct: false },
      { id: "d", text: "They are identical", correct: false },
    ],
    explanationShort: "Pick based on existence; always provide payer, seeds, and bump.",
    explanationFull: `• init is strict one-time\n• init_if_needed tolerates prior create\n• Funds rent via payer\n• Deterministic PDAs via seeds`,
  },
  {
    id: "ab-space-sizing",
    topic: "Anchor Basics",
    q: "How do I size accounts correctly?",
    aMd: `Plan struct size before deploy: 8 bytes discriminator + fields.
Add padding for future growth when possible.
Resizing uses realloc with payer and checks.
Document your math to avoid bugs.

Size example
\`\`\`rust
const SIZE: usize = 8 /*disc*/ + 32 /*pubkey*/ + 8 /*u64*/;
\`\`\``,
    quizOptions: [
      { id: "a", text: "Compute 8-byte discriminator + field sizes; add buffer if needed", correct: true },
      { id: "b", text: "Let Anchor auto-calculate at runtime", correct: false },
      { id: "c", text: "Always over-allocate 1 MB for safety", correct: false },
      { id: "d", text: "Size doesn’t affect rent", correct: false },
    ],
    explanationShort: "Account size drives rent; plan and document the math.",
    explanationFull: `• 8-byte discriminator\n• Add field sizes + padding\n• Realloc needs payer\n• Test space changes`,
  },
  {
    id: "ab-events",
    topic: "Anchor Basics",
    q: "What are Anchor events for?",
    aMd: `Events are cheap, structured logs for off-chain listeners.
Emit analytics breadcrumbs without writing state.
Do not rely on events as the source of truth.

Rust
\`\`\`rust
#[event] pub struct Created { pub id: u64 }
emit!(Created { id })
\`\`\``,
    quizOptions: [
      { id: "a", text: "Structured logs for off-chain indexing and analytics", correct: true },
      { id: "b", text: "A way to store critical state cheaply", correct: false },
      { id: "c", text: "A tool to skip CPIs", correct: false },
      { id: "d", text: "A mechanism to upgrade programs", correct: false },
    ],
    explanationShort: "Great for analytics; don’t store critical truth in events.",
    explanationFull: `• Logs with schema\n• Filterable by indexers\n• Cheaper than writes\n• Not a database`,
  },
  {
    id: "ab-testing",
    topic: "Anchor Basics",
    q: "What’s a good testing strategy in Anchor?",
    aMd: `Write unit tests for pure Rust logic first.
Add integration tests for full instruction flows.
Seed PDAs deterministically; assert events and balances.
Fail fast on constraint errors to learn early.

Rust test
\`\`\`rust
#[tokio::test]
async fn it_works() { /* setup, send ix, assert */ }
\`\`\``,
    quizOptions: [
      { id: "a", text: "Unit + integration tests; deterministic PDAs; assert logs and balances", correct: true },
      { id: "b", text: "Only test on mainnet beta", correct: false },
      { id: "c", text: "Skip events and balances in tests", correct: false },
      { id: "d", text: "Rely on manual clicking in dapps", correct: false },
    ],
    explanationShort: "Automate both logic and end-to-end flows with assertions.",
    explanationFull: `• Unit tests for logic\n• Integration for flows\n• Deterministic seeds\n• Check events/balances`,
  },
  {
    id: "ab-accounts-vs-state",
    topic: "Anchor Basics",
    q: "Where does state live in Anchor programs?",
    aMd: `All mutable state lives in accounts that you pass to instructions.
Programs themselves are stateless between calls.
Design explicit PDAs for config/records; avoid hidden globals.
Events mirror actions but do not store truth.
\nRust
\`\`\`rust
#[account]
pub struct Config { pub admin: Pubkey }
\`\`\``,
    quizOptions: [
      { id: "a", text: "In accounts you pass in; programs are stateless between calls", correct: true },
      { id: "b", text: "In a global variable stored in the program binary", correct: false },
      { id: "c", text: "In the RPC node memory", correct: false },
      { id: "d", text: "In events that are emitted", correct: false },
    ],
    explanationShort: "Think databases with rows (accounts), not global app memory.",
    explanationFull: `• State in accounts\n• Programs read/write via constraints\n• Events are logs only\n• Plan PDAs for each record type`,
  },
  {
    id: "ab-idl",
    topic: "Anchor Basics",
    q: "What is the Anchor IDL used for?",
    aMd: `IDL is a JSON description of your program's interface.
Clients generate methods and types from it.
It documents instructions, accounts, and errors.
Keep it versioned and in sync with deployments.

View with CLI
\`\`\`bash
anchor idl fetch <PROGRAM_ID>
\`\`\``,
    quizOptions: [
      { id: "a", text: "A JSON spec of instructions/accounts that clients use", correct: true },
      { id: "b", text: "A secret key store for program signers", correct: false },
      { id: "c", text: "A rent calculator", correct: false },
      { id: "d", text: "A token list file", correct: false },
    ],
    explanationShort: "IDLs enable typed client generation and documentation.",
    explanationFull: `• JSON interface\n• Client codegen\n• Documents errors/accounts\n• Version cautiously`,
  },
  {
    id: "ab-realloc",
    topic: "Anchor Basics",
    q: "How do I safely resize an account (realloc)?",
    aMd: `Use realloc with payer and proper ownership checks.
Ensure the new size’s rent-exempt minimum is funded.
Avoid shrinking below actual data; copy carefully.
Test realloc paths for edge cases.

Rust
\`\`\`rust
let acct = &mut ctx.accounts.my;
acct.realloc(new_len, false)?;
\`\`\``,
    quizOptions: [
      { id: "a", text: "Realloc with payer, fund new rent min, and keep ownership checks", correct: true },
      { id: "b", text: "Overwrite owner to System to bypass rent", correct: false },
      { id: "c", text: "Shrink freely without copying data", correct: false },
      { id: "d", text: "No tests needed for realloc", correct: false },
    ],
    explanationShort: "Resizing changes rent needs; always test and fund correctly.",
    explanationFull: `• Provide payer\n• Recalc rent\n• Copy data safely\n• Validate owner/constraints`,
  },
  {
    id: "ab-errors",
    topic: "Anchor Basics",
    q: "How should I design clear errors in Anchor?",
    aMd: `Define precise error enums; avoid generic failures.
Surface which field/constraint failed in messages.
Map errors to user-facing hints in your dapp.

Rust
\`\`\`rust
#[error_code]
pub enum Error { #[msg("Invalid authority")] InvalidAuthority }
\`\`\``,
    quizOptions: [
      { id: "a", text: "Use specific error codes/messages that map to user hints", correct: true },
      { id: "b", text: "Always return ProgramError::Custom(0)", correct: false },
      { id: "c", text: "Hide errors to avoid leaks", correct: false },
      { id: "d", text: "Only use panic! for failures", correct: false },
    ],
    explanationShort: "Good errors speed debugging and improve UX.",
    explanationFull: `• Specific enums\n• Helpful messages\n• Consistent mapping in UI\n• Avoid generic Unknown`,
  },

  // =========================
  // 3) PDAs & Programs (10)
  // =========================
  {
    id: "pp-what",
    topic: "PDAs & Programs",
    q: "What is a PDA?",
    aMd: `A PDA is a program-owned address derived from seeds and a bump.
It has no private key; the program signs for it using seeds.
Great for storing program state at predictable addresses.

Rust derive
\`\`\`rust
let (pda, bump) = Pubkey::find_program_address(&[b"STATE"], &program_id);
\`\`\``,
    quizOptions: [
      { id: "a", text: "A program-owned derived address without a private key", correct: true },
      { id: "b", text: "A normal wallet the user controls", correct: false },
      { id: "c", text: "A temporary throwaway account", correct: false },
      { id: "d", text: "A validator vote account", correct: false },
    ],
    explanationShort: "PDAs store program state; programs prove control via seeds.",
    explanationFull: `• Derived with seeds+bump\n• No keypair exists\n• Predictable locations\n• Safer than EOAs for program state`,
  },
  {
    id: "pp-seeds-bump",
    topic: "PDAs & Programs",
    q: "How do seeds and bump work together?",
    aMd: `Seeds are inputs; bump helps avoid collisions.
find_program_address returns both PDA and bump.
Store bump if needed; use same seeds across flows.

Rust
\`\`\`rust
let (pda, bump) = Pubkey::find_program_address(&[b"USER", user.key().as_ref()], &id());
\`\`\``,
    quizOptions: [
      { id: "a", text: "Seeds derive the address; bump avoids collisions", correct: true },
      { id: "b", text: "Only bump is required; seeds are optional", correct: false },
      { id: "c", text: "Seeds and bump are interchangeable", correct: false },
      { id: "d", text: "Bump equals the program id", correct: false },
    ],
    explanationShort: "Use stable seeds + bump; keep formats consistent over time.",
    explanationFull: `• Persist bump if needed\n• Keep seed order stable\n• Document seed formulas\n• Incompatibility breaks signer seeds`,
  },
  {
    id: "pp-as-signer",
    topic: "PDAs & Programs",
    q: "How does a PDA sign without a keypair?",
    aMd: `Programs pass signer seeds during invoke (or CPI).
Runtime checks the seeds/bump match the PDA and owner.
If valid, the PDA counts as a signer for that call.

Rust (CPI)
\`\`\`rust
invoke_signed(&ix, &accounts, &[&[b"STATE", &[bump]]])?;
\`\`\``,
    quizOptions: [
      { id: "a", text: "By providing matching seeds+bump so the runtime authorizes it", correct: true },
      { id: "b", text: "By using a hidden private key on-chain", correct: false },
      { id: "c", text: "By asking the wallet to cosign", correct: false },
      { id: "d", text: "By disabling signature checks", correct: false },
    ],
    explanationShort: "Signer seeds let PDAs act as signers for a single call.",
    explanationFull: `• invoke_signed with seeds\n• Runtime verifies ownership\n• No private key exists\n• Limited to the current call`,
  },
  {
    id: "pp-naming",
    topic: "PDAs & Programs",
    q: "How should I name PDA seeds?",
    aMd: `Use fixed namespace tags and stable order.
Avoid human text that might change; prefer bytes tags.
Add entity-specific sub-seeds (e.g., user/pubkey).

Example seeds
\`\`\`rust
&[b"APP", b"USER", user.key().as_ref()]
\`\`\``,
    quizOptions: [
      { id: "a", text: "Fixed tags + stable order; add entity sub-seeds like a user key", correct: true },
      { id: "b", text: "Random strings to increase entropy each call", correct: false },
      { id: "c", text: "User-provided free text in every instruction", correct: false },
      { id: "d", text: "Only the program id is needed", correct: false },
    ],
    explanationShort: "Stable seed schemes make addresses predictable and safe.",
    explanationFull: `• Root tag e.g. b"APP"\n• Child tags per record\n• No attacker-controlled seeds\n• Document for integrators`,
  },
  {
    id: "pp-authority",
    topic: "PDAs & Programs",
    q: "What is an authority PDA pattern?",
    aMd: `Use a PDA as the authority for mints, vaults, or config.
Program signs via seeds to move tokens or update settings.
Prevents EOAs from holding critical privileges.

Token example
\`\`\`rust
let authority = Pubkey::find_program_address(&[b"AUTH"], &id()).0;
// Set mint_authority = authority
\`\`\``,
    quizOptions: [
      { id: "a", text: "A PDA that owns sensitive privileges like mint or fee vaults", correct: true },
      { id: "b", text: "A special sysvar for security", correct: false },
      { id: "c", text: "A wallet that admins share", correct: false },
      { id: "d", text: "A governance token", correct: false },
    ],
    explanationShort: "Authority PDAs prevent key loss and centralization risks.",
    explanationFull: `• No private key to leak\n• Program-controlled\n• Good for fee vaults\n• Common in SPL flows`,
  },
  {
    id: "pp-cpi-basics",
    topic: "PDAs & Programs",
    q: "What is a CPI (cross-program invocation)?",
    aMd: `A CPI is when your program calls another program.
You pass that program’s required accounts and data.
Use invoke/invoke_signed depending on PDA signers.

Rust
\`\`\`rust
invoke(&ix, &accounts)?; // or invoke_signed(...)
\`\`\``,
    quizOptions: [
      { id: "a", text: "A program calling another program with its accounts/data", correct: true },
      { id: "b", text: "A client calling your program", correct: false },
      { id: "c", text: "A retry of a failed tx", correct: false },
      { id: "d", text: "A validator vote", correct: false },
    ],
    explanationShort: "CPIs compose programs; ensure correct accounts and signers.",
    explanationFull: `• Use invoke/invoke_signed\n• Provide exact accounts\n• Check program ids\n• Start minimal then expand`,
  },
  {
    id: "pp-migrations",
    topic: "PDAs & Programs",
    q: "How do I migrate from one PDA to another?",
    aMd: `Plan new seeds; write a one-time instruction to copy state.
Freeze writes to the old address during migration.
Emit events; keep a version field for tracking.

Idea
\`\`\`rust
// read old, write new, mark old as migrated
\`\`\``,
    quizOptions: [
      { id: "a", text: "Copy state with a controlled one-time instruction and versioning", correct: true },
      { id: "b", text: "Overwrite the owner to move it instantly", correct: false },
      { id: "c", text: "Rename the program id", correct: false },
      { id: "d", text: "Use events as the only source of truth", correct: false },
    ],
    explanationShort: "Migrations copy data safely; announce new addresses.",
    explanationFull: `• Freeze writes\n• Event breadcrumbs\n• Version fields\n• Test with real sizes`,
  },
  {
    id: "pp-security",
    topic: "PDAs & Programs",
    q: "Common PDA security mistakes?",
    aMd: `Using attacker-controlled seeds or changing seed order later.
Forgetting has_one/owner checks on related accounts.
Mismatched bumps that break signer seeds.

Checklist
\`\`\`md
• Stable seeds\n• Owner checks\n• Relation checks\n• Tests try hostile swaps
\`\`\``,
    quizOptions: [
      { id: "a", text: "Dynamic user-controlled seeds and missing owner checks", correct: false },
      { id: "b", text: "Stable seeds, owner checks, and relation checks", correct: true },
      { id: "c", text: "Using invoke_signed for all calls", correct: false },
      { id: "d", text: "Never storing bumps anywhere", correct: false },
    ],
    explanationShort: "Lock down seed schemes and verify relationships/owners.",
    explanationFull: `• Avoid user-controlled seeds\n• Maintain seed order\n• has_one on relations\n• Test hostile swaps`,
  },
  {
    id: "pp-cpi-ids",
    topic: "PDAs & Programs",
    q: "Why check program IDs in CPIs?",
    aMd: `Always ensure you invoke the intended program ID.
Prevent account/prog swaps that redirect funds.
Document required program IDs for integrators.

Rust
\`\`\`rust
require_keys_eq!(token_program.key(), spl_token::ID);
\`\`\``,
    quizOptions: [
      { id: "a", text: "To prevent malicious account/program swaps during CPIs", correct: true },
      { id: "b", text: "To reduce compute units", correct: false },
      { id: "c", text: "Because the runtime rejects unknown programs", correct: false },
      { id: "d", text: "To fetch rent-exempt minimums", correct: false },
    ],
    explanationShort: "Pin program IDs to expected values for safety.",
    explanationFull: `• Prevent redirection\n• Safer integrations\n• Clear docs\n• Less audit risk`,
  },
  {
    id: "pp-docs",
    topic: "PDAs & Programs",
    q: "What should I document for integrators?",
    aMd: `Document PDAs and seed formulas; list instructions and constraints.
Publish required program IDs and account layouts.
Provide example clients and events.

Doc bullets
\`\`\`md
• PDA seeds\n• Accounts + sizes\n• Required program IDs\n• Example TS/Rust calls
\`\`\``,
    quizOptions: [
      { id: "a", text: "Seeds, accounts, sizes, program IDs, and example calls", correct: true },
      { id: "b", text: "Only the program id", correct: false },
      { id: "c", text: "Just the README title", correct: false },
      { id: "d", text: "Only events; accounts are implicit", correct: false },
    ],
    explanationShort: "Good docs lower integration and audit friction.",
    explanationFull: `• Seed formulas\n• Account shapes\n• CPI program ids\n• Client examples`,
  },

  // =====================================
  // 4) Transactions & Troubleshooting (10)
  // =====================================
  {
    id: "tt-atomic",
    topic: "Transactions & Troubleshooting",
    q: "Are Solana transactions atomic?",
    aMd: `Yes—either all included instructions succeed or all fail.
Bundle checks + updates safely, but watch compute/size.
Emit events to aid off-chain recovery flows.

TS
\`\`\`ts
const tx = new Transaction().add(ix1, ix2)
// If ix2 fails, ix1 effects are rolled back
\`\`\``,
    quizOptions: [
      { id: "a", text: "Yes, all-or-nothing across included instructions", correct: true },
      { id: "b", text: "No, each instruction commits separately", correct: false },
      { id: "c", text: "Only on devnet", correct: false },
      { id: "d", text: "Only for single-instruction txs", correct: false },
    ],
    explanationShort: "Atomicity makes multi-step flows predictable.",
    explanationFull: `• Group related steps\n• Beware compute/size\n• Log via events\n• Test failure paths`,
  },
  {
    id: "tt-compute",
    topic: "Transactions & Troubleshooting",
    q: "How to handle compute budget limits?",
    aMd: `Optimize heavy loops and expensive CPIs.
Split work across smaller instructions when needed.
Request more compute wisely via the budget program.

TS
\`\`\`ts
ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 })
\`\`\``,
    quizOptions: [
      { id: "a", text: "Optimize, split work, and request more compute when necessary", correct: true },
      { id: "b", text: "Always request max compute for all txs", correct: false },
      { id: "c", text: "Rely on retries to finish loops", correct: false },
      { id: "d", text: "Disable CPI checks to save units", correct: false },
    ],
    explanationShort: "Profile hotspots; add compute units only as needed.",
    explanationFull: `• Avoid heavy loops\n• Cache derivations\n• Minimize CPIs\n• Measure with logs`,
  },
  {
    id: "tt-order",
    topic: "Transactions & Troubleshooting",
    q: "Does instruction order matter?",
    aMd: `Yes—later instructions see earlier writes.
Validate before mutating; initialize before use.
Close last to reclaim lamports cleanly.

Comment the order
\`\`\`md
1) validate, 2) mutate, 3) CPI, 4) close
\`\`\``,
    quizOptions: [
      { id: "a", text: "Yes, order affects reads/writes and correctness", correct: true },
      { id: "b", text: "No, runtime reorders for you", correct: false },
      { id: "c", text: "Only matters with CPIs", correct: false },
      { id: "d", text: "Only matters with SOL transfers", correct: false },
    ],
    explanationShort: "Order prevents subtle race-like issues.",
    explanationFull: `• Validate early\n• Init before use\n• Close/cleanup last\n• Test order explicitly`,
  },
  {
    id: "tt-sim",
    topic: "Transactions & Troubleshooting",
    q: "Why simulate transactions before sending?",
    aMd: `Simulation reveals failures without fees and prints logs.
Sanity-check accounts and compute usage ahead of time.
State can still change between sim and send—don’t assume success.

TS
\`\`\`ts
connection.simulateTransaction(tx)
\`\`\``,
    quizOptions: [
      { id: "a", text: "To catch errors/logs cheaply and check compute", correct: true },
      { id: "b", text: "To guarantee final success", correct: false },
      { id: "c", text: "To skip signatures", correct: false },
      { id: "d", text: "To reorder instructions", correct: false },
    ],
    explanationShort: "Sim first; still handle race conditions in live send.",
    explanationFull: `• No fees to test\n• Inspect logs\n• Check compute\n• Not a guarantee`,
  },
  {
    id: "tt-retries",
    topic: "Transactions & Troubleshooting",
    q: "How should I handle retries?",
    aMd: `Treat retries as normal; use idempotency and replace-once.
Show pending states in UI to prevent double clicks.
Back off instead of hammering the RPC.

Idea
\`\`\`md
• Idempotency keys\n• Replace recent blockhash once\n• Log signatures
\`\`\``,
    quizOptions: [
      { id: "a", text: "Use idempotency, backoff, and pending UI states", correct: true },
      { id: "b", text: "Spam RPC with the same tx endlessly", correct: false },
      { id: "c", text: "Hide pending state to avoid confusion", correct: false },
      { id: "d", text: "Regenerate new txs without dedupe", correct: false },
    ],
    explanationShort: "Idempotent retry flows feel invisible to users.",
    explanationFull: `• Pending UI\n• Backoff strategy\n• Dedupe keys\n• Support tracing`,
  },
  {
    id: "tt-discriminator",
    topic: "Transactions & Troubleshooting",
    q: "Discriminator mismatch—what does it mean?",
    aMd: `Anchor couldn't match the 8-byte account discriminator.
Likely struct layout changed or account created by older program.
Migrate or recreate with the new layout; test on devnet first.

Rust
\`\`\`md
• New account with updated struct\n• Or one-time migration instruction
\`\`\``,
    quizOptions: [
      { id: "a", text: "Account layout/owner changed; migrate or recreate", correct: true },
      { id: "b", text: "RPC version too old", correct: false },
      { id: "c", text: "Clock sysvar missing", correct: false },
      { id: "d", text: "Using Token-2022 by mistake", correct: false },
    ],
    explanationShort: "Old accounts don’t match new discriminator after layout changes.",
    explanationFull: `• Discriminator identifies type\n• Layout changes break decode\n• Plan migrations\n• Test before mainnet`,
  },
  {
    id: "tt-constraint",
    topic: "Transactions & Troubleshooting",
    q: "Why am I seeing a constraint violation?",
    aMd: `An Anchor constraint check failed (owner, seeds, has_one, signer, etc.).
Compare Context struct to passed accounts; verify seeds and bump.
Print addresses to eyeball mismatches in tests.

Rust
\`\`\`md
• Check #[account(...)] rules\n• Verify seeds order\n• Ensure required signers
\`\`\``,
    quizOptions: [
      { id: "a", text: "Accounts don’t satisfy declared constraints; fix owners/seeds/signers", correct: true },
      { id: "b", text: "RPC rate limit", correct: false },
      { id: "c", text: "Unit test timeout only", correct: false },
      { id: "d", text: "Wallet uses the wrong theme", correct: false },
    ],
    explanationShort: "Read the exact error and check each annotated field.",
    explanationFull: `• Owner matches?\n• Seeds+bump correct?\n• Signer/mutability flags?\n• Print and compare`,
  },
  {
    id: "tt-owner",
    topic: "Transactions & Troubleshooting",
    q: "Account owned by wrong program—how to resolve?",
    aMd: `The passed account isn’t owned by your program.
Ensure it was created/assigned with your program id.
For SPL accounts, use the correct token program constraints.

Rust
\`\`\`md
• Create with SystemProgram + owner = your program id\n• Or use proper Program<'info, Token>
\`\`\``,
    quizOptions: [
      { id: "a", text: "Create/assign with your program id; use correct constraints for external accounts", correct: true },
      { id: "b", text: "Overwrite the owner field manually", correct: false },
      { id: "c", text: "Rely on events to fix ownership", correct: false },
      { id: "d", text: "Ignore and proceed", correct: false },
    ],
    explanationShort: "Ownership ensures state safety; pass the right accounts.",
    explanationFull: `• SystemProgram assign\n• SPL Token accounts owned by token program\n• Don’t override owner\n• Use constraints`,
  },
  {
    id: "tt-signature",
    topic: "Transactions & Troubleshooting",
    q: "Missing required signature—what to check?",
    aMd: `Signer flags must match who actually signs.
Wallets: include keypair in send/sign.
PDAs: provide signer seeds in invoke_signed.

TS/Rust
\`\`\`md
• tx includes keypair\n• invoke_signed([...seeds])
\`\`\``,
    quizOptions: [
      { id: "a", text: "Ensure wallet keypair signs or PDA signer seeds are provided", correct: true },
      { id: "b", text: "Mark every account as signer just in case", correct: false },
      { id: "c", text: "Drop the instruction that fails", correct: false },
      { id: "d", text: "Use simulate to skip signatures", correct: false },
    ],
    explanationShort: "Only required keys should sign; PDAs sign via seeds.",
    explanationFull: `• Wallets sign tx\n• PDAs via seeds\n• Don’t over-request\n• Surface signer list in UI`,
  },
  {
    id: "tt-rent",
    topic: "Transactions & Troubleshooting",
    q: "Why is my account not rent-exempt?",
    aMd: `Space or network rent changed; you funded too little.
Recalculate minimum after any realloc or size change.
Top up with a transfer from a payer.

TS
\`\`\`ts
const min = await connection.getMinimumBalanceForRentExemption(space)
\`\`\``,
    quizOptions: [
      { id: "a", text: "You funded less than the minimum for its size; recalc and top up", correct: true },
      { id: "b", text: "The account was upgraded to read-only", correct: false },
      { id: "c", text: "The owner program changed automatically", correct: false },
      { id: "d", text: "Rent doesn’t exist on Solana", correct: false },
    ],
    explanationShort: "Rent depends on byte size; fund enough lamports.",
    explanationFull: `• Space drives rent\n• Realloc alters need\n• Provide payer\n• Assert in tests`,
  },
];

/**
 * Utilities (unchanged API from previous file for drop-in compatibility)
 */
export function findById(id: string): KBEntry | null {
  return KNOWLEDGE.find((entry) => entry.id === id) || null;
}

export function getQuizQuestions(): KBEntry[] {
  return KNOWLEDGE.filter((entry) => entry.quizOptions && entry.quizOptions.length >= 4);
}

export function getRandomQuizQuestion(): KBEntry | null {
  const questions = getQuizQuestions();
  if (questions.length === 0) return null;
  return questions[Math.floor(Math.random() * questions.length)];
}

/**
 * Get a random quiz question from a specific topic
 */
export function getQuizQuestionByTopic(topic: Topic): KBEntry | null {
  const questions = getQuizQuestions().filter(entry => entry.topic === topic);
  if (questions.length === 0) return null;
  return questions[Math.floor(Math.random() * questions.length)];
}

export function firstSentence(text: string): string {
  const cleanText = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/[#*_`]/g, "")
    .trim();
  const match = cleanText.match(/^[^.!?]+[.!?]/);
  if (match) return match[0].trim();
  return cleanText.substring(0, 100).trim() + (cleanText.length > 100 ? "..." : "");
}

export function findBestMatch(question: string): KBEntry | null {
  const normalizedQuestion = question.toLowerCase().trim();
  if (!normalizedQuestion) return null;
  const questionKeywords = normalizedQuestion
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .filter((w) => !["how", "do", "the", "you", "and", "for", "get", "what", "why", "when", "where", "are", "with"].includes(w));
  const phrases: string[] = [];
  for (let i = 0; i < questionKeywords.length - 1; i++) phrases.push(`${questionKeywords[i]} ${questionKeywords[i + 1]}`);
  let bestMatch: KBEntry | null = null;
  let bestScore = 0;
  for (const entry of KNOWLEDGE) {
    const normalizedEntryQ = entry.q.toLowerCase();
    if (normalizedEntryQ === normalizedQuestion) return entry;
    if (normalizedEntryQ.includes(normalizedQuestion) || normalizedQuestion.includes(normalizedEntryQ)) return entry;
    for (const ph of phrases) if (normalizedEntryQ.includes(ph)) return entry;
    let score = 0;
    let matched = 0;
    for (const k of questionKeywords) {
      if (normalizedEntryQ.includes(k)) {
        score += k.length;
        matched++;
      }
    }
    if (matched >= 2) score += 5;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }
  return bestScore >= 8 && bestMatch ? bestMatch : null;
}

export function catalog(): {
  levels: { level: number; name: string; items: { id: string; q: string; topic: Topic }[] }[];
  topics: { title: Topic; items: { id: string; q: string }[] }[];
  count: number;
} {
  const levelGrouped = new Map<number, { id: string; q: string; topic: Topic }[]>();
  const topicGrouped = new Map<Topic, { id: string; q: string }[]>();

  // No explicit levels requested; assign all to a single pseudo-level (1)
  for (const entry of KNOWLEDGE) {
    if (!levelGrouped.has(1)) levelGrouped.set(1, []);
    levelGrouped.get(1)!.push({ id: entry.id, q: entry.q, topic: entry.topic });

    if (!topicGrouped.has(entry.topic)) topicGrouped.set(entry.topic, []);
    topicGrouped.get(entry.topic)!.push({ id: entry.id, q: entry.q });
  }

  const levels = Array.from(levelGrouped.entries())
    .map(([level, items]) => ({ level, name: "All", items: items.sort((a, b) => a.q.localeCompare(b.q)) }))
    .sort((a, b) => a.level - b.level);

  const topics = Array.from(topicGrouped.entries())
    .map(([title, items]) => ({ title, items: items.sort((a, b) => a.q.localeCompare(b.q)) }))
    .sort((a, b) => a.title.localeCompare(b.title));

  return { levels, topics, count: KNOWLEDGE.length };
}

/**
 * Deterministic daily pick based on UTC date
 * Returns a question based on the date (same date = same question)
 */
export function dailyPick(dateISO: string): { id: string; q: string; topic: Topic } | null {
  if (KNOWLEDGE.length === 0) return null;
  
  // Use date as seed for deterministic selection
  const date = new Date(dateISO);
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const index = dayOfYear % KNOWLEDGE.length;
  
  const entry = KNOWLEDGE[index];
  return {
    id: entry.id,
    q: entry.q,
    topic: entry.topic,
  };
}

export const KB = KNOWLEDGE;
export type KnowledgeEntry = KBEntry;
