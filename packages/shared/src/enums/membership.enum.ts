/**
 * Membership Enums
 * Defines user membership and invite statuses
 * 
 * DB: membership_status ENUM, invite_status ENUM
 */

export enum MembershipStatus {
  ACTIVE = 'ACTIVE',
  INVITED = 'INVITED',
  SUSPENDED = 'SUSPENDED',
}

export const MembershipStatusLabels: Record<MembershipStatus, string> = {
  [MembershipStatus.ACTIVE]: 'Active',
  [MembershipStatus.INVITED]: 'Invited',
  [MembershipStatus.SUSPENDED]: 'Suspended',
};

export enum InviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export const InviteStatusLabels: Record<InviteStatus, string> = {
  [InviteStatus.PENDING]: 'Pending',
  [InviteStatus.ACCEPTED]: 'Accepted',
  [InviteStatus.EXPIRED]: 'Expired',
  [InviteStatus.REVOKED]: 'Revoked',
};
