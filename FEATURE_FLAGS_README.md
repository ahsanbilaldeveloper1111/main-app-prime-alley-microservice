# Feature Flags for GenericListPage

The `GenericListPage` component now supports feature flags to dynamically enable/disable functionality without modifying the component code.

## Available Flags

### `rowClick: boolean`
- **Default**: `false`
- **Purpose**: Enables clickable table rows
- **Behavior**: When `true`, table rows become clickable and show pointer cursor on hover
- **Usage**: Set to `true` to make rows clickable

### `showCanvas: boolean`
- **Default**: `false`
- **Purpose**: Enables canvas drawing functionality when rows are clicked
- **Behavior**: When `true`, clicking a row opens a canvas drawing modal
- **Usage**: Set to `true` to enable canvas functionality

## Usage Examples

### Basic Usage (No Flags)
```tsx
<GenericListPage
    columns={columns}
    fetchData={fetchUsers}
    title="Users"
    // No flags - default behavior (no row clicking, no canvas)
/>
```

### Enable Row Clicking Only
```tsx
<GenericListPage
    columns={columns}
    fetchData={fetchUsers}
    title="Users"
    rowClick={true}
    showCanvas={false}
/>
```

### Enable Canvas Functionality
```tsx
<GenericListPage
    columns={columns}
    fetchData={fetchUsers}
    title="Users"
    rowClick={true}      // Required for canvas to work
    showCanvas={true}    // Enables canvas modal
/>
```

### Custom Row Click Handler with Canvas
```tsx
<GenericListPage
    columns={columns}
    fetchData={fetchUsers}
    title="Users"
    rowClick={true}
    showCanvas={true}
    onRowClick={(row) => {
        // Custom logic here
        console.log('Row clicked:', row);
        // Canvas will still open automatically
    }}
/>
```

## How It Works

1. **Row Click Flag**: When `rowClick={true}`, the table rows become clickable and show a pointer cursor on hover.

2. **Canvas Flag**: When `showCanvas={true}`, clicking a row automatically opens a canvas drawing modal.

3. **Combined Behavior**: Both flags can be used together or independently.

4. **Custom Handlers**: If you provide an `onRowClick` handler, it will be called in addition to the canvas functionality.

## Canvas Features

The canvas modal includes:
- Interactive drawing with mouse
- Adjustable brush size (1-20px)
- Color picker for brush color
- Clear canvas button
- Download canvas as PNG
- Display of selected row data
- Responsive design

## Implementation Details

- Flags are passed through `GenericListPage` to `CustomDataTable`
- Canvas state is managed internally by `GenericListPage`
- No external dependencies required
- Fully responsive and accessible
- TypeScript support included

## Example Implementation

```tsx
// In your page component
<GenericListPage
    columns={userColumns}
    fetchData={fetchUserData}
    title="User Management"
    searchPlaceholder="Search users..."
    defaultPageSize={15}
    // Enable interactive features
    rowClick={true}
    showCanvas={true}
    // Optional: custom row click handler
    onRowClick={(user) => {
        // Custom logic here
        console.log('User selected:', user.name);
    }}
/>
```

## Notes

- `showCanvas` requires `rowClick={true}` to function properly
- Canvas modal is only rendered when `showCanvas={true}`
- All existing functionality remains unchanged when flags are `false`
- Performance impact is minimal when flags are disabled
