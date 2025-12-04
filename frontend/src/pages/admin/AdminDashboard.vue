<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Admin Dashboard</h1>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="p-4 border rounded">
        <h2 class="font-semibold">Users</h2>
        <p class="text-sm text-slate-500">View and block/unblock users.</p>
        <RouterLink class="mt-3 inline-block text-blue-600" to="/admin/users">Manage Users →</RouterLink>
      </div>

      <div class="p-4 border rounded">
        <h2 class="font-semibold">Create Administrator</h2>
        <p class="text-sm text-slate-500">Create new administrator accounts.</p>
        <RouterLink class="mt-3 inline-block text-blue-600" to="/admin/create">Create Admin →</RouterLink>
      </div>

      <div class="p-4 border rounded">
        <h2 class="font-semibold">Transactions</h2>
        <p class="text-sm text-slate-500">Read-only list of coin transactions.</p>
        <RouterLink class="mt-3 inline-block text-blue-600" to="/admin/transactions">View Transactions →</RouterLink>
      </div>

      <div class="p-4 border rounded">
        <h2 class="font-semibold">Games</h2>
        <p class="text-sm text-slate-500">Read-only list of games.</p>
        <RouterLink class="mt-3 inline-block text-blue-600" to="/admin/games">View Games →</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
</style>
