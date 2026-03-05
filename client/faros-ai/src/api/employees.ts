import { gql } from 'graphql-request';

export const GET_EMPLOYEES = gql`
  query GetEmployees(
    $first: Int
    $after: String
    $search: String
    $filter: EmployeeFilter
  ) {
    employees(first: $first, after: $after, search: $search, filter: $filter) {
      edges {
        cursor
        node {
          id
          uid
          name
          email
          photoUrl
          inactive
          trackingStatus
          trackingCategory
          teams {
            id
            uid
            name
          }
          accounts {
            type
            source
            uid
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        endCursor
        startCursor
      }
      totalCount
    }
  }
`;

export const GET_EMPLOYEE = gql`
  query GetEmployee($id: ID!) {
    employee(id: $id) {
      id
      uid
      name
      email
      photoUrl
      inactive
      trackingStatus
      trackingCategory
      teams {
        id
        uid
        name
      }
      accounts {
        type
        source
        uid
      }
    }
  }
`;

export const GET_FILTER_OPTIONS = gql`
  query GetFilterOptions {
    filterOptions {
      teams {
        uid
        name
      }
      trackingStatuses
      trackingCategories
      accountTypes {
        type
        source
      }
    }
  }
`;
