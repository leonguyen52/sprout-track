# Table Component

A comprehensive table component system with modern styling, dark mode support, and full TypeScript support. Built with clean, rounded edges and consistent theming that matches the application design.

## Features

- Modern, clean design with soft rounded edges
- Full dark mode support
- Responsive design with horizontal scrolling
- Hover effects and selection states
- TypeScript support with proper type definitions
- Accessible markup with proper ARIA attributes
- Modular component structure

## Components

The Table system consists of eight main components:

1. `Table` - The main table container with overflow handling
2. `TableHeader` - The header section (`<thead>`)
3. `TableBody` - The body section (`<tbody>`)
4. `TableFooter` - The footer section (`<tfoot>`)
5. `TableRow` - Table rows (`<tr>`)
6. `TableHead` - Header cells (`<th>`)
7. `TableCell` - Data cells (`<td>`)
8. `TableCaption` - Table caption

## Basic Usage

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";

export function BasicTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>John Doe</TableCell>
          <TableCell>john@example.com</TableCell>
          <TableCell>Admin</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Jane Smith</TableCell>
          <TableCell>jane@example.com</TableCell>
          <TableCell>User</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
```

## Advanced Usage

### With Caption and Footer

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";

export function AdvancedTable() {
  return (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">INV001</TableCell>
          <TableCell>Paid</TableCell>
          <TableCell>Credit Card</TableCell>
          <TableCell className="text-right">$250.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">INV002</TableCell>
          <TableCell>Pending</TableCell>
          <TableCell>PayPal</TableCell>
          <TableCell className="text-right">$150.00</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">$400.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
```

### With Actions

```tsx
import { Button } from "@/src/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";

export function TableWithActions() {
  const users = [
    { id: 1, name: "John Doe", email: "john@example.com", role: "Admin" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "User" },
  ];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

## Props

All table components extend their respective HTML element props:

### Table Props
- Extends `React.TableHTMLAttributes<HTMLTableElement>`
- `className?: string` - Additional CSS classes

### TableHeader Props
- Extends `React.HTMLAttributes<HTMLTableSectionElement>`
- `className?: string` - Additional CSS classes

### TableBody Props
- Extends `React.HTMLAttributes<HTMLTableSectionElement>`
- `className?: string` - Additional CSS classes

### TableFooter Props
- Extends `React.HTMLAttributes<HTMLTableSectionElement>`
- `className?: string` - Additional CSS classes

### TableRow Props
- Extends `React.HTMLAttributes<HTMLTableRowElement>`
- `className?: string` - Additional CSS classes

### TableHead Props
- Extends `React.ThHTMLAttributes<HTMLTableCellElement>`
- `className?: string` - Additional CSS classes

### TableCell Props
- Extends `React.TdHTMLAttributes<HTMLTableCellElement>`
- `className?: string` - Additional CSS classes

### TableCaption Props
- Extends `React.HTMLAttributes<HTMLTableCaptionElement>`
- `className?: string` - Additional CSS classes

## Styling

The table component uses Tailwind CSS with a clean, modern design:

### Design Features
- Rounded corners (xl) for the table container
- Soft borders and subtle shadows
- Hover effects on table rows
- Selection states with indigo accent
- Responsive design with horizontal scrolling
- Consistent spacing and typography

### Color Scheme
- Light mode: White background with gray accents
- Dark mode: Dark gray background with appropriate contrast
- Borders: Subtle gray borders that adapt to theme
- Text: High contrast text for readability

## Accessibility

The table component follows accessibility best practices:
- Proper semantic HTML table structure
- Support for table captions
- Keyboard navigation support
- Screen reader friendly markup
- Sufficient color contrast in both themes
- Focus indicators for interactive elements

## Best Practices

1. **Always use TableHeader for column headers**
2. **Provide meaningful captions when helpful**
3. **Use consistent column widths**
4. **Keep table content scannable**
5. **Consider responsive behavior for narrow screens**
6. **Use TableFooter for summary information**
7. **Implement proper loading and empty states**

## Mobile Considerations

The table automatically provides horizontal scrolling on smaller screens. For better mobile experience, consider:

- Prioritizing the most important columns
- Using responsive classes to hide less critical columns
- Implementing alternative layouts for very narrow screens
- Ensuring touch targets are appropriately sized

## Cross-Platform Notes

When adapting for React Native:
- Convert table structure to ScrollView with column layouts
- Use React Native's StyleSheet instead of Tailwind classes
- Implement touch-friendly interactions
- Consider platform-specific design patterns for data display 