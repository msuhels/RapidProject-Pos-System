# UI Components Guide

## Dropdown/Select Components

We now have **two dropdown components** to choose from based on your needs:

---

## 1. Select Component (Enhanced Native)

**Location:** `src/core/components/ui/select.tsx`

### Features:
- ✅ Enhanced native HTML select with custom styling
- ✅ Custom dropdown arrow icon
- ✅ Smooth hover and focus effects
- ✅ Rounded corners with modern design
- ✅ Dark mode support
- ✅ Responsive and mobile-friendly
- ✅ Better performance (native browser control)

### When to Use:
- Forms with many options (better performance)
- When you need native browser features (search, keyboard navigation)
- Mobile-first applications (native mobile picker)
- Simple dropdowns without complex requirements

### Usage:
```tsx
import { Select } from '@/core/components/ui/select';

<Select
  label="Select Role"
  value={role}
  onChange={(e) => setRole(e.target.value)}
  options={[
    { value: 'admin', label: 'Administrator' },
    { value: 'user', label: 'User' },
    { value: 'guest', label: 'Guest' }
  ]}
  error={errors.role}
/>
```

### Improvements Made:
- Custom chevron icon instead of default browser arrow
- Rounded corners (`rounded-lg`)
- Smooth transitions on hover and focus
- Better border colors with hover effects
- Enhanced spacing and padding
- Animated error messages
- Dark mode optimized colors

---

## 2. CustomSelect Component (Fully Custom)

**Location:** `src/core/components/ui/custom-select.tsx`

### Features:
- ✅ Fully custom dropdown with beautiful animations
- ✅ Checkmark indicator for selected items
- ✅ Smooth open/close animations
- ✅ Click outside to close
- ✅ Custom styling for each option
- ✅ Hover effects on options
- ✅ Dark mode support
- ✅ Maximum control over appearance

### When to Use:
- When you need a premium, polished look
- Dashboard interfaces
- Settings pages
- When you want complete control over styling
- When you need custom option rendering

### Usage:
```tsx
import { CustomSelect } from '@/core/components/ui/custom-select';

<CustomSelect
  label="Select Role"
  placeholder="Choose a role"
  value={selectedRole}
  onChange={(value) => setSelectedRole(value)}
  options={[
    { value: 'admin', label: 'Administrator' },
    { value: 'user', label: 'User' },
    { value: 'guest', label: 'Guest' }
  ]}
  error={errors.role}
  disabled={isLoading}
/>
```

### Features in Detail:

#### Visual Design:
- Smooth fade-in and slide-down animations
- Checkmark icon for selected option
- Hover effects with background color change
- Rotating chevron icon on open/close
- Shadow effects for depth
- Rounded corners with modern styling

#### Interactions:
- Click to open/close
- Click outside to close automatically
- Keyboard accessible
- Disabled state support
- Error state with red border and message

#### Responsive:
- Works on all screen sizes
- Touch-friendly on mobile
- Scrollable option list for many items
- Maximum height with scroll

---

## Comparison Table

| Feature | Select (Native) | CustomSelect |
|---------|----------------|--------------|
| Performance | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good |
| Customization | ⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent |
| Mobile Experience | ⭐⭐⭐⭐⭐ Native picker | ⭐⭐⭐⭐ Custom |
| Animations | ⭐⭐⭐ Basic | ⭐⭐⭐⭐⭐ Advanced |
| Visual Appeal | ⭐⭐⭐⭐ Enhanced | ⭐⭐⭐⭐⭐ Premium |
| Accessibility | ⭐⭐⭐⭐⭐ Native | ⭐⭐⭐⭐ Custom |
| Bundle Size | ⭐⭐⭐⭐⭐ Minimal | ⭐⭐⭐⭐ Small |

---

## Migration Guide

### From Old Select to Enhanced Select:
No changes needed! The API remains the same, just with better styling.

### From Select to CustomSelect:
```tsx
// Before (Select)
<Select
  value={role}
  onChange={(e) => setRole(e.target.value)}
  options={options}
/>

// After (CustomSelect)
<CustomSelect
  value={role}
  onChange={(value) => setRole(value)}  // Note: direct value, not event
  options={options}
/>
```

**Key Difference:** CustomSelect's `onChange` receives the value directly, not an event object.

---

## Styling Customization

### Select Component:
```tsx
<Select
  className="custom-class"  // Add custom classes
  options={options}
/>
```

### CustomSelect Component:
```tsx
<CustomSelect
  className="w-full md:w-64"  // Custom width
  options={options}
/>
```

---

## Dark Mode

Both components automatically adapt to dark mode:
- Background colors adjust
- Border colors change
- Text remains readable
- Hover states work in both modes

---

## Best Practices

1. **Use Select for:**
   - Forms with 10+ options
   - Mobile-first applications
   - When performance is critical
   - When you need native browser features

2. **Use CustomSelect for:**
   - Dashboard interfaces
   - Settings pages
   - When visual appeal is important
   - When you have fewer options (< 20)

3. **Always provide:**
   - Clear labels
   - Helpful error messages
   - Appropriate placeholder text
   - Disabled state when loading

4. **User-facing feedback:**
   - **Do not use native `alert` / `confirm` / `prompt` dialogs anywhere in the app**
   - Use `toast` notifications (from `sonner`) for errors, warnings, and success feedback
   - Use in-app dialogs (e.g. `Dialog` component) or explicit secondary actions for confirmations (delete, destructive actions, etc.)
   - Keep error messages specific (e.g. “Title is required”) instead of generic (“Validation failed”)

5. **Accessibility:**
   - Both components are keyboard accessible
   - Use descriptive labels
   - Provide error messages for screen readers
   - Test with keyboard navigation

---

## Examples in the Codebase

### Current Usage (Select):
- `UserTable.tsx` - Role and status filters
- `RoleTable.tsx` - Status filters
- `ExpandableRoleTable.tsx` - Status filters
- `UserForm.tsx` - Role selection
- `RoleForm.tsx` - Status selection

All these continue to work with the enhanced Select component!

---

## Future Enhancements

Potential improvements for CustomSelect:
- [ ] Multi-select support
- [ ] Search/filter functionality
- [ ] Option groups
- [ ] Custom option rendering with icons
- [ ] Async option loading
- [ ] Virtual scrolling for large lists

---

## Support

For issues or questions about the dropdown components:
1. Check this documentation
2. Review the component source code
3. Test in both light and dark modes
4. Verify responsive behavior

---

**Last Updated:** December 2024



<<<<<<< HEAD

=======
>>>>>>> 75792a5028c0870ec37b1460bf3531510b17439e









