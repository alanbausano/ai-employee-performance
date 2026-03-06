/**
 * resolvers.js — GraphQL schema and resolvers for employee data.
 *
 * Implements cursor-based pagination, search, and filtering.
 * The data is loaded from data/employees.json at startup.
 */

import gql from 'graphql-tag';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const employees = JSON.parse(
  readFileSync(join(__dirname, 'data', 'employees.json'), 'utf-8')
);

// ============================================================
// Schema
// ============================================================

export const typeDefs = gql`
  type Query {
    """
    Paginated, filterable list of employees.
    Uses cursor-based pagination (Relay-style).
    """
    employees(
      first: Int = 10
      after: String
      search: String
      filter: EmployeeFilter
    ): EmployeeConnection!

    """
    Single employee by ID or UID.
    """
    employee(id: ID!): Employee

    """
    Available filter values (for populating filter dropdowns).
    """
    filterOptions: FilterOptions!
  }

  input EmployeeFilter {
    "Filter by team UID(s). Returns employees belonging to ANY of the specified teams."
    teams: [String!]
    "Filter by account type(s): vcs, tms, ims, cal. Returns employees with ANY of these."
    accountTypes: [String!]
    "Filter by tracking status: Included, Ignored."
    trackingStatuses: [String!]
    "Filter by tracking category: Active, Inactive."
    trackingCategories: [String!]
  }

  type EmployeeConnection {
    edges: [EmployeeEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type EmployeeEdge {
    node: Employee!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    endCursor: String
    startCursor: String
  }

  type Employee {
    id: ID!
    uid: String!
    name: String
    email: String
    photoUrl: String
    inactive: Boolean
    trackingStatus: String
    trackingCategory: String
    teams: [Team!]!
    accounts: [Account!]!
  }

  type Team {
    id: ID!
    uid: String!
    name: String!
  }

  type Account {
    "Account category: vcs, tms, ims, cal"
    type: String!
    "Source system name: GitHub, Jira, PagerDuty, Google Calendar"
    source: String!
    uid: String!
  }

  type FilterOptions {
    teams: [TeamOption!]!
    trackingStatuses: [String!]!
    trackingCategories: [String!]!
    accountTypes: [AccountTypeOption!]!
  }

  type TeamOption {
    uid: String!
    name: String!
  }

  type AccountTypeOption {
    type: String!
    source: String!
  }
`;

// ============================================================
// Resolvers
// ============================================================

export const resolvers = {
  Query: {
    employees: (_parent, args) => {
      const { first = 10, after, search, filter } = args;
      let filtered = [...employees];

      // ---- Search (case-insensitive on name and uid) ----
      if (search && search.trim()) {
        const term = search.trim().toLowerCase();
        filtered = filtered.filter((e) => {
          const name = (e.name || '').toLowerCase();
          const uid = (e.uid || '').toLowerCase();
          const email = (e.email || '').toLowerCase();
          return name.includes(term) || uid.includes(term) || email.includes(term);
        });
      }

      // ---- Filters ----
      if (filter) {
        if (filter.teams && filter.teams.length > 0) {
          filtered = filtered.filter((e) =>
            e.teams.some((t) => filter.teams.includes(t.uid))
          );
        }
        if (filter.accountTypes && filter.accountTypes.length > 0) {
          filtered = filtered.filter((e) =>
            e.accounts.some((a) => filter.accountTypes.includes(a.type))
          );
        }
        if (filter.trackingStatuses && filter.trackingStatuses.length > 0) {
          filtered = filtered.filter((e) =>
            filter.trackingStatuses.includes(e.trackingStatus)
          );
        }
        if (filter.trackingCategories && filter.trackingCategories.length > 0) {
          filtered = filtered.filter((e) =>
            filter.trackingCategories.includes(e.trackingCategory)
          );
        }
      }

      // ---- Cursor pagination ----
      const totalCount = filtered.length;
      let startIndex = 0;

      if (after) {
        const afterIndex = decodeCursor(after);
        if (afterIndex !== null && afterIndex < filtered.length) {
          startIndex = afterIndex + 1;
        }
      }

      const sliced = filtered.slice(startIndex, startIndex + first);

      const edges = sliced.map((node, i) => ({
        node,
        cursor: encodeCursor(startIndex + i),
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage: startIndex + first < totalCount,
          hasPreviousPage: startIndex > 0,
          startCursor: edges.length > 0 ? edges[0].cursor : null,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
        },
        totalCount,
      };
    },

    employee: (_parent, { id }) => {
      return employees.find((e) => e.id === id || e.uid === id) || null;
    },

    filterOptions: () => {
      // Derive available filter values from the data
      const teamMap = new Map();
      const statusSet = new Set();
      const categorySet = new Set();
      const accountMap = new Map();

      for (const emp of employees) {
        for (const team of emp.teams) {
          teamMap.set(team.uid, { uid: team.uid, name: team.name });
        }
        if (emp.trackingStatus) statusSet.add(emp.trackingStatus);
        if (emp.trackingCategory) categorySet.add(emp.trackingCategory);
        for (const acc of emp.accounts) {
          accountMap.set(acc.type, { type: acc.type, source: acc.source });
        }
      }

      return {
        teams: [...teamMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
        trackingStatuses: [...statusSet].sort(),
        trackingCategories: [...categorySet].sort(),
        accountTypes: [...accountMap.values()].sort((a, b) =>
          a.source.localeCompare(b.source)
        ),
      };
    },
  },
};

// ============================================================
// Cursor encoding (base64-wrapped index — intentionally simple)
// ============================================================

function encodeCursor(index) {
  return Buffer.from(`cursor:${index}`).toString('base64');
}

function decodeCursor(cursor) {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const match = decoded.match(/^cursor:(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  } catch {
    return null;
  }
}
