// import { groupPermissionsByAction } from "@/utils/group-permission-by-action";
// import rolePermission from "@/constants/role-permission.json";

// export default function PermissionsPage() {
//   const permissions = rolePermission.data.map((p) => ({
//     ...p,
//     description: p.description || "",
//   }));
//   const groupedPermissions = groupPermissionsByAction(permissions);

//   return (
//     <div className="p-8 space-y-8 bg-background min-h-screen text-foreground animate-in fade-in duration-500">
//       <div className="flex flex-col gap-2">
//         <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
//           Permissions
//         </h1>
//         <p className="text-muted-foreground">
//           Manage and view system permissions grouped by action.
//         </p>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//         {Object.entries(groupedPermissions).map(([action, items]) => (
//           <div
//             key={action}
//             className="group border rounded-xl p-5 shadow-sm hover:shadow-md transition-all bg-card text-card-foreground border-border/50 hover:border-border"
//           >
//             <div className="flex items-center justify-between mb-4 border-b pb-2">
//               <h2 className="capitalize text-lg font-semibold text-primary">
//                 {action}
//               </h2>
//               <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
//                 {items.length}
//               </span>
//             </div>
//             <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
//               {items.map((perm) => (
//                 <li
//                   key={perm.id}
//                   className="p-2 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors"
//                 >
//                   <p className="font-medium text-sm text-foreground break-all">
//                     {perm.name}
//                   </p>
//                   <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
//                     {perm.description}
//                   </p>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
