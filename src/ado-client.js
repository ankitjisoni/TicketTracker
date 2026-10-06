/**
 * Azure DevOps REST API client
 *
 * Provides helpers to fetch individual or batched work items from the
 * Azure DevOps Work Item Tracking API (v7.1).
 *
 * Requires ADO_ORG, ADO_PROJECT, and ADO_PAT environment variables.
 */

const fetch = require('node-fetch');

// ---------------------------------------------------------------------------
// Configuration (read once at module load; dotenv should already be loaded)
// ---------------------------------------------------------------------------

function getConfig() {
  const org = process.env.ADO_ORG;
  const project = process.env.ADO_PROJECT;
  const pat = process.env.ADO_PAT;

  if (!org || !project || !pat) {
    throw new Error(
      '[ado-client] Missing required env vars: ADO_ORG, ADO_PROJECT, ADO_PAT'
    );
  }

  return {
    baseUrl: `https://dev.azure.com/${org}/${project}/_apis`,
    authHeader:
      'Basic ' + Buffer.from(`:${pat}`).toString('base64'),
  };
}

// ---------------------------------------------------------------------------
// Response parser
// ---------------------------------------------------------------------------

/**
 * Parse a raw ADO work-item JSON response into a flat, app-friendly object.
 * @param {object} raw — single work-item object from the ADO API
 * @returns {object}
 */
function parseWorkItem(raw) {
  const fields = raw.fields || {};
  const assignedTo = fields['System.AssignedTo'];
  const changedBy = fields['System.ChangedBy'];
  const createdBy = fields['System.CreatedBy'];

  const storyPointsRaw =
    fields['Microsoft.VSTS.Scheduling.StoryPoints'] ??
    fields['Microsoft.VSTS.Scheduling.Effort'] ??
    fields['Microsoft.VSTS.Scheduling.OriginalEstimate'] ??
    null;
  const storyPoints =
    storyPointsRaw !== null && !isNaN(Number(storyPointsRaw))
      ? Number(storyPointsRaw)
      : null;

  return {
    id: raw.id,
    title: fields['System.Title'] || null,
    state: fields['System.State'] || null,
    assignedTo: assignedTo ? assignedTo.displayName : null,
    changedBy: changedBy
      ? (typeof changedBy === 'string' ? changedBy : changedBy.displayName)
      : null,
    createdBy: createdBy
      ? (typeof createdBy === 'string' ? createdBy : createdBy.displayName)
      : null,
    workItemType: fields['System.WorkItemType'] || null,
    priority: fields['Microsoft.VSTS.Common.Priority'] ?? null,
    areaPath: fields['System.AreaPath'] || null,
    iterationPath: fields['System.IterationPath'] || null,
    storyPoints,
    teamProject: fields['System.TeamProject'] || null,
    url: raw._links && raw._links.html ? raw._links.html.href : null,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch a single work item by its ADO id.
 * @param {number} id — Azure DevOps work-item id
 * @returns {Promise<object|null>} parsed work item, or null on 404 / error
 */
async function fetchWorkItem(id) {
  try {
    const { baseUrl, authHeader } = getConfig();
    const url = `${baseUrl}/wit/workitems/${id}?$expand=all&api-version=7.1`;

    const res = await fetch(url, {
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    });

    // Treat 404 as "not found" — don't throw
    if (res.status === 404) {
      console.warn(`[ado-client] Work item ${id} not found (404)`);
      return null;
    }

    if (!res.ok) {
      const body = await res.text();
      console.error(
        `[ado-client] Failed to fetch work item ${id}: ${res.status} — ${body}`
      );
      return null;
    }

    const data = await res.json();
    return parseWorkItem(data);
  } catch (err) {
    console.error(`[ado-client] Error fetching work item ${id}:`, err.message);
    return null;
  }
}

/**
 * Fetch multiple work items in a single batch request.
 * @param {number[]} ids — array of ADO work-item ids
 * @returns {Promise<object[]>} array of parsed work items (skips failures)
 */
async function fetchMultipleWorkItems(ids) {
  if (!ids || ids.length === 0) return [];

  try {
    const { baseUrl, authHeader } = getConfig();
    const idsParam = ids.join(',');
    const url = `${baseUrl}/wit/workitems?ids=${idsParam}&$expand=all&api-version=7.1`;

    const res = await fetch(url, {
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(
        `[ado-client] Batch fetch failed: ${res.status} — ${body}`
      );
      return [];
    }

    const data = await res.json();
    // The batch endpoint returns { count, value: [...] }
    const items = data.value || [];
    return items.map(parseWorkItem);
  } catch (err) {
    console.error('[ado-client] Error in batch fetch:', err.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// WIQL Query
// ---------------------------------------------------------------------------

/**
 * Execute a WIQL (Work Item Query Language) query against Azure DevOps.
 * @param {string} wiql — the WIQL query string
 * @returns {Promise<number[]>} array of matching work-item IDs
 */
async function queryWorkItemsByWiql(wiql) {
  try {
    const { baseUrl, authHeader } = getConfig();
    const url = `${baseUrl}/wit/wiql?api-version=7.1`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: wiql }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[ado-client] WIQL query failed: ${res.status} — ${body}`);
      return [];
    }

    const data = await res.json();
    // WIQL returns { workItems: [{ id, url }, ...] }
    return (data.workItems || []).map((wi) => wi.id);
  } catch (err) {
    console.error('[ado-client] Error executing WIQL query:', err.message);
    return [];
  }
}

/**
 * Fetch work items by IDs with specific fields.
 * Handles batching (max 200 IDs per request).
 * @param {number[]} ids — array of work-item IDs
 * @returns {Promise<object[]>} parsed work items
 */
async function fetchWorkItemsWithFields(ids) {
  if (!ids || ids.length === 0) return [];

  const results = [];
  const BATCH_SIZE = 200;

  try {
    const { baseUrl, authHeader } = getConfig();

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      const idsParam = batch.join(',');
      const url = `${baseUrl}/wit/workitems?ids=${idsParam}&$expand=all&api-version=7.1`;

      const res = await fetch(url, {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const body = await res.text();
        console.error(
          `[ado-client] Batch fetch (offset ${i}) failed: ${res.status} — ${body}`
        );
        continue;
      }

      const data = await res.json();
      const items = data.value || [];
      results.push(...items.map(parseWorkItem));
    }
  } catch (err) {
    console.error('[ado-client] Error in fetchWorkItemsWithFields:', err.message);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Team Members
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Team Members
// ---------------------------------------------------------------------------

/**
 * Fetch all users from the Azure DevOps organization.
 * Strategy: Since Graph API often fails due to PAT scope limitations, we:
 * 1. Fetch users from all explicit Project Teams.
 * 2. Run a WIQL query for recent work items and extract all names from
 *    AssignedTo, CreatedBy, and ChangedBy to catch users not in teams.
 * @returns {Promise<string[]>} sorted array of unique display names
 */
async function fetchTeamMembers() {
  const org = process.env.ADO_ORG;
  const project = process.env.ADO_PROJECT;
  const pat = process.env.ADO_PAT;
  const authHeader = 'Basic ' + Buffer.from(`:${pat}`).toString('base64');

  const memberSet = new Set();

  // --- Strategy 1: Project Teams API ---
  try {
    const teamsUrl = `https://dev.azure.com/${org}/_apis/projects/${project}/teams?$top=500&api-version=7.1`;
    const teamsRes = await fetch(teamsUrl, {
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
    });

    if (teamsRes.ok) {
      const teamsData = await teamsRes.json();
      const teams = teamsData.value || [];

      for (const team of teams) {
        try {
          const membersUrl = `https://dev.azure.com/${org}/_apis/projects/${project}/teams/${encodeURIComponent(team.id)}/members?$top=500&api-version=7.1`;
          const membersRes = await fetch(membersUrl, {
            headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
          });

          if (!membersRes.ok) continue;

          const membersData = await membersRes.json();
          for (const member of (membersData.value || [])) {
            const name = member.identity?.displayName;
            if (name && !name.startsWith('[')) memberSet.add(name);
          }
        } catch { /* skip team */ }
      }
    }
  } catch (err) {
    console.warn('[ado-client] Teams API error:', err.message);
  }

  // --- Strategy 2: WIQL Extraction (recent work items) ---
  try {
    const wiql = `SELECT [System.Id] FROM WorkItems WHERE [System.ChangedDate] >= @today - 120 ORDER BY [System.ChangedDate] DESC`;
    const ids = await queryWorkItemsByWiql(wiql);
    
    // Fetch top 1500 items to extract names
    if (ids.length > 0) {
      const items = await fetchWorkItemsWithFields(ids.slice(0, 1500));
      for (const item of items) {
        if (item.assignedTo && typeof item.assignedTo === 'string' && !item.assignedTo.startsWith('[')) {
          memberSet.add(item.assignedTo);
        }
        if (item.createdBy && typeof item.createdBy === 'string' && !item.createdBy.startsWith('[')) {
          memberSet.add(item.createdBy);
        }
        if (item.changedBy && typeof item.changedBy === 'string' && !item.changedBy.startsWith('[')) {
          memberSet.add(item.changedBy);
        }
      }
    }
  } catch (err) {
    console.warn('[ado-client] WIQL extraction error:', err.message);
  }

  const result = Array.from(memberSet).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  console.log(`[ado-client] Total unique members: ${result.length}`);
  return result;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Advanced Filtering
// ---------------------------------------------------------------------------

/**
 * Given a list of work item IDs, fetches their update histories and filters
 * the list to ONLY include tickets where the target user was the ChangedBy,
 * AssignedTo, or CreatedBy *during* the specified date range.
 * 
 * @param {number[]} ids - List of candidate ADO Work Item IDs
 * @param {string} targetUser - The exact display name of the user
 * @param {string} dateFrom - YYYY-MM-DD
 * @param {string} dateTo - YYYY-MM-DD
 * @returns {Promise<number[]>} - Filtered list of IDs
 */
async function filterIdsByExactUserActivity(ids, targetUser, dateFrom, dateTo) {
  if (!ids || ids.length === 0) return [];

  const org = process.env.ADO_ORG;
  const project = process.env.ADO_PROJECT;
  const pat = process.env.ADO_PAT;
  const authHeader = 'Basic ' + Buffer.from(`:${pat}`).toString('base64');

  // Convert dates to JS Dates for comparison (inclusive of full end day)
  const dFrom = new Date(`${dateFrom}T00:00:00Z`);
  const dTo = new Date(`${dateTo}T23:59:59Z`);

  const matchedIds = [];

  // Batch process to avoid hitting API limits too hard
  const BATCH_SIZE = 20;
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (id) => {
      try {
        const url = `https://dev.azure.com/${org}/_apis/wit/workitems/${id}/updates?api-version=7.1`;
        const res = await fetch(url, {
          headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
        });

        if (!res.ok) return;
        const data = await res.json();
        
        let userMatchedInRange = false;
        if (data && data.value) {
          for (const update of data.value) {
            if (!update.fields || !update.fields['System.ChangedDate']) continue;
            
            const revDate = new Date(update.fields['System.ChangedDate'].newValue);
            if (revDate >= dFrom && revDate <= dTo) {
              const changedBy = update.fields['System.ChangedBy']?.newValue?.displayName || '';
              const assignedTo = update.fields['System.AssignedTo']?.newValue?.displayName || '';
              const createdBy = update.fields['System.CreatedBy']?.newValue?.displayName || '';
              
              if (changedBy === targetUser || assignedTo === targetUser || createdBy === targetUser) {
                userMatchedInRange = true;
                break;
              }
            }
          }
        }
        if (userMatchedInRange) {
          matchedIds.push(id);
        }
      } catch (err) {
        console.warn(`[ado-client] Error fetching updates for ${id}:`, err.message);
      }
    }));
  }

  return matchedIds;
}

/**
 * Fetch project iterations hierarchy from Azure DevOps classification nodes API.
 * Flattens the hierarchy into an array of path strings.
 * @returns {Promise<string[]>}
 */
async function fetchIterations() {
  const org = process.env.ADO_ORG;
  const project = process.env.ADO_PROJECT;
  const pat = process.env.ADO_PAT;
  const authHeader = 'Basic ' + Buffer.from(`:${pat}`).toString('base64');

  const iterations = [];

  function traverseNode(node, currentPath) {
    const path = currentPath ? `${currentPath}\\${node.name}` : node.name;
    iterations.push(path);
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        traverseNode(child, path);
      }
    }
  }

  try {
    const url = `https://dev.azure.com/${org}/${project}/_apis/wit/classificationnodes/iterations?$depth=5&api-version=7.1`;
    const res = await fetch(url, {
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      traverseNode(data, '');
    }
  } catch (err) {
    console.warn('[ado-client] Failed to fetch iterations classification:', err.message);
  }

  return iterations.sort((a, b) => a.localeCompare(b));
}

module.exports = {
  fetchWorkItem,
  fetchMultipleWorkItems,
  queryWorkItemsByWiql,
  fetchWorkItemsWithFields,
  fetchTeamMembers,
  filterIdsByExactUserActivity,
  fetchIterations,
};
