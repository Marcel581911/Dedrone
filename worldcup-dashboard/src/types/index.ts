export type DealStatus = 'open' | 'closed';
export type DeliveryReadyStatus = 'yes' | 'no' | 'partial';
export type DeliveredStatus = 'delivered' | 'in-transit' | 'pending';
export type OwnershipType = 'SLTT' | 'Federal' | 'Private';
export type SupportType = 'on-site' | 'virtual';

export interface Equipment {
  id: string;
  name: string;
  model: string;
  quantity: number;
  ownership: OwnershipType;
  ownerName: string;
  dealStatus: DealStatus;
  deliveryReady: DeliveryReadyStatus;
  delivered: DeliveredStatus;
}

export interface SupportPerson {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  supportType: SupportType;
  available: boolean;
}

export interface HostCity {
  id: string;
  city: string;
  state: string;
  country: 'US' | 'CA';
  venue: string;
  lat: number;
  lng: number;
  equipment: Equipment[];
  supportTeam: SupportPerson[];
}
