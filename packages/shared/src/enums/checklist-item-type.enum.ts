/**
 * Checklist Item Type Enum
 * Defines input types for checklist template items
 * 
 * DB: checklist_item_type ENUM
 */
export enum ChecklistItemType {
  BOOL = 'BOOL',
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  SELECT = 'SELECT',
  PHOTO = 'PHOTO',
}

export const ChecklistItemTypeLabels: Record<ChecklistItemType, string> = {
  [ChecklistItemType.BOOL]: 'Yes/No',
  [ChecklistItemType.TEXT]: 'Text',
  [ChecklistItemType.NUMBER]: 'Number',
  [ChecklistItemType.SELECT]: 'Dropdown',
  [ChecklistItemType.PHOTO]: 'Photo',
};
