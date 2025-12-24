/**
 * UI Standards and Guidelines
 * 
 * This file defines the standard UI patterns used across all modules
 * to ensure consistency and maintainability.
 */

/**
 * DIALOG SPACING STANDARDS
 * 
 * All dialogs should follow this structure:
 * 
 * ```tsx
 * <Dialog open={open} onOpenChange={setOpen}>
 *   <DialogContent className="max-w-2xl">  // No explicit padding here
 *     <DialogHeader>  // Has padding: px-6 pt-6 pb-2
 *       <DialogTitle>Title</DialogTitle>
 *     </DialogHeader>
 *     <div className="px-6 py-4">  // Content wrapper with consistent padding
 *       {/* Form content here *\/}
 *     </div>
 *     <DialogFooter>  // Has padding: px-6 pb-6 pt-4
 *       <Button>Cancel</Button>
 *       <Button>Save</Button>
 *     </DialogFooter>
 *   </DialogContent>
 * </Dialog>
 * ```
 * 
 * DO NOT add padding classes like 'p-6' or 'space-y-4' to DialogContent.
 * The padding is already handled by DialogHeader, DialogFooter, and the content wrapper.
 */

/**
 * TABLE ACTION BUTTONS STANDARDS
 * 
 * All table action buttons should use icons instead of text.
 * Use the TableActions component for consistency:
 * 
 * ```tsx
 * import { TableActions } from '@/core/components/common/TableActions';
 * 
 * <TableCell className="text-right">
 *   <TableActions
 *     item={item}
 *     onEdit={onEdit}
 *     onDelete={onDelete}
 *     onDuplicate={onDuplicate}  // Optional
 *     showDuplicate={false}  // If duplicate not needed
 *   />
 * </TableCell>
 * ```
 * 
 * The TableActions component provides:
 * - Consistent icon buttons (Pencil for edit, Trash2 for delete, Copy for duplicate)
 * - Proper spacing and alignment
 * - Tooltips for accessibility
 */

/**
 * MODULE STRUCTURE STANDARDS
 * 
 * Each module should follow this directory structure:
 * 
 * src/modules/[module-name]/
 * ├── api/
 * │   ├── endpoints.ts
 * │   └── handlers/
 * │       ├── create.ts
 * │       ├── list.ts
 * │       ├── update.ts
 * │       ├── delete.ts
 * │       └── getById.ts
 * ├── components/
 * │   ├── [Module]Form.tsx      // Form component
 * │   ├── [Module]Table.tsx     // Table component
 * │   └── ...                   // Other specific components
 * ├── config/
 * │   ├── fields.config.ts
 * │   └── permissions.config.ts
 * ├── hooks/
 * │   ├── use[Module].ts
 * │   └── ...
 * ├── routes/
 * │   └── index.tsx             // Main page component
 * ├── schemas/
 * │   ├── [module]Schema.ts     // Database schema
 * │   └── [module]Validation.ts // Validation schema
 * ├── services/
 * │   └── [module]Service.ts
 * ├── types/
 * │   └── index.ts
 * └── module.config.json
 */

/**
 * FORM STANDARDS
 * 
 * Forms should be separated into their own components:
 * - Named [Module]Form.tsx (e.g., StudentsForm.tsx)
 * - Accept form state and onChange handler as props
 * - Use consistent grid layouts (grid-cols-1 md:grid-cols-2)
 * - Use Label and Input/Select/Textarea from ui components
 */

/**
 * TABLE STANDARDS
 * 
 * Tables should be separated into their own components:
 * - Named [Module]Table.tsx (e.g., StudentsTable.tsx)
 * - Accept data array, loading state, and action handlers as props
 * - Use TableActions component for action buttons
 * - Include proper loading and empty states
 * - Actions column should be right-aligned with className="text-right"
 */

/**
 * FILTER STANDARDS
 * 
 * Filter sections should be consistent:
 * - Search input with Search icon
 * - Filters in a flex row with proper spacing
 * - Status/category filters using Select components
 * - Clear filters button when filters are active
 * 
 * IMPORTANT - SEARCH DEBOUNCING:
 * - ALWAYS use debouncing for search inputs
 * - Use the useDebounce hook with 300ms delay
 * - User input should update immediately (responsive)
 * - API calls should use debounced value (efficient)
 * 
 * Example:
 * ```tsx
 * import { useDebounce } from '@/core/hooks/useDebounce';
 * 
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 300);
 * 
 * useEffect(() => {
 *   fetchData(debouncedSearch); // Use debounced value
 * }, [debouncedSearch]); // Depend on debounced, not immediate
 * 
 * <Input 
 *   value={search} // Use immediate for responsive typing
 *   onChange={(e) => setSearch(e.target.value)} 
 * />
 * ```
 */

/**
 * CARD STANDARDS
 * 
 * Page layout should use Card components:
 * - CardHeader with title and action buttons
 * - CardContent with filters and data display
 * - Consistent spacing: space-y-4
 */

export const UI_STANDARDS = {
  dialog: {
    contentPadding: 'px-6 py-4',
    maxWidths: {
      small: 'max-w-md',
      medium: 'max-w-lg',
      large: 'max-w-2xl',
      xlarge: 'max-w-3xl',
    },
  },
  table: {
    actionsColumn: 'text-right',
    actionsCell: 'text-right',
  },
  spacing: {
    section: 'space-y-4',
    form: 'space-y-4',
    filters: 'gap-3',
  },
  search: {
    debounceDelay: 300, // milliseconds
  },
  performance: {
    // All filtering and sorting MUST be done on the server
    clientSideFiltering: false, // NEVER filter on client side
    clientSideSorting: false,   // NEVER sort on client side
    debounceSearch: true,       // ALWAYS debounce search inputs
  },
} as const;

