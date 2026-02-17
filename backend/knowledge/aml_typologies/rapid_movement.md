# Typology: Rapid Movement of Funds

## Overview
Rapid movement of funds involves the quick transfer of money through one or more accounts, often within the same day or a short period (24-48 hours). This technique aims to obfuscate the source of funds or consolidate them before further layering, often associated with fraud schemes, cybercrime, or mule networks.

## Red Flags
- Funds deposited and immediately withdrawn or transferred.
- High velocity of transactions (Velocity Score > 5.0).
- Transfers to unrelated third parties shortly after receipt.
- "Pass-through" account activity with minimal end-of-day balances.
- Use of immediate payment rails (RTP, Wire) for non-urgent transactions.
- Transactions structured to appear just below reporting thresholds but executed rapidly.

## Investigation Steps
1. Analyze the time gap between incoming credit and outgoing debit (latency).
2. identify the source of funds (often multiple unknown originators).
3. Identify the destination of funds (often high-risk jurisdictions or crypto exchanges).
4. Review the account holder's business profile for legitimacy of high-velocity activity.
5. Check for linked accounts or shared device fingerprints suggesting a coordinated network.

## SAR Narrative Guidance
- Explicitly state the speed of movement (e.g., "funds remained in account for less than 1 hour").
- Highlight the lack of economic rationale for the rapid turnover.
- Connect the activity to potential underlying crimes like fraud or money laundering.
