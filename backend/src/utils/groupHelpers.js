import { neon } from '@neondatabase/serverless';

/**
 * Efficiently fetch groups with their excluded members in a single batch query
 * @param {Function} sql - Neon SQL function
 * @param {Array} groups - Array of group objects to enrich with member data
 * @returns {Promise<Array>} Groups with members array attached
 */
export async function fetchGroupsWithMembers(sql, groups) {
  if (!groups || groups.length === 0) {
    return groups;
  }

  const groupIds = groups.map(g => g.id);
  
  // Fetch all excluded members for all groups in a single query
  // Note: We only store members that have exclusions or need special tracking
  // The group.count field represents the total number of members
  const members = await sql`
    SELECT 
      id, 
      name, 
      group_id as "groupId",
      is_paying as "isPaying",
      exclude_from_all_headcount as "excludeFromAllHeadcount",
      exclude_from_internal_headcount as "excludeFromInternalHeadcount"
    FROM group_members
    WHERE group_id = ANY(${groupIds})
    ORDER BY group_id, id
  `;
  
  // Group members by group_id
  const membersByGroupId = {};
  for (const member of members) {
    const { groupId, ...memberData } = member;
    if (!membersByGroupId[groupId]) {
      membersByGroupId[groupId] = [];
    }
    membersByGroupId[groupId].push(memberData);
  }
  
  // Attach members to each group
  for (const group of groups) {
    group.members = membersByGroupId[group.id] || [];
  }
  
  return groups;
}

/**
 * Calculate billable counts for a group based on exclusions
 * Uses group.count as total members and deducts excluded members
 * @param {Object} group - Group object with count and members array
 * @returns {Object} Calculated counts
 */
export function calculateGroupCounts(group) {
  const totalCount = group.count; // Total members from group.count
  const excludedMembers = group.members || [];
  
  // Count exclusions
  // Note: If a member is globally excluded, we don't also count them as internally excluded
  // because they're already excluded from the base calculation
  let globallyExcluded = 0;
  let internallyExcluded = 0;
  
  excludedMembers.forEach(member => {
    if (member.excludeFromAllHeadcount) {
      globallyExcluded++;
    } else if (group.type === 'Internal' && member.excludeFromInternalHeadcount) {
      // Only count as internally excluded if NOT already globally excluded
      internallyExcluded++;
    }
  });
  
  // Billable count for base cost (excludes only globally excluded)
  const billableCount = totalCount - globallyExcluded;
  
  // Internal billable count for payment (excludes both global and internal)
  let internalBillableCount;
  if (group.type === 'Internal') {
    internalBillableCount = totalCount - globallyExcluded - internallyExcluded;
  } else {
    internalBillableCount = billableCount;
  }
  
  return {
    totalCount,
    billableCount,
    internalBillableCount,
    globallyExcluded,
    internallyExcluded
  };
}
