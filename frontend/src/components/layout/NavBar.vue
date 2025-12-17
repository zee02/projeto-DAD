<template>
    <div>
        <NavigationMenu>
            <NavigationMenuList class="justify-around gap-8">

                <NavigationMenuItem>
                    <NavigationMenuLink>
                        <RouterLink to="/">Home</RouterLink>
                    </NavigationMenuLink>
                </NavigationMenuItem>
                
                <NavigationMenuItem v-if="userLoggedIn">
                    <NavigationMenuTrigger>Stats</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <li>
                            <NavigationMenuLink as-child>
                                <RouterLink to="/leaderboards">Leaderboards</RouterLink>
                            </NavigationMenuLink>
                            <NavigationMenuLink as-child>
                                <RouterLink to="/stats">Site Statistics</RouterLink>
                            </NavigationMenuLink>
                            <NavigationMenuLink as-child>
                                <RouterLink to="/history">Game History</RouterLink>
                            </NavigationMenuLink>

                            <NavigationMenuLink v-if="userLoggedIn && user && user.type === 'A'" as-child>
                                <RouterLink to="/admin/analytics">Admin Analytics</RouterLink>
                            </NavigationMenuLink>
                        </li>
                    </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem v-if="!userLoggedIn">
                    <NavigationMenuLink>
                        <RouterLink to="/login">Login</RouterLink>
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem v-if="userLoggedIn && user && user.type === 'A'">
                    <NavigationMenuLink>
                        <RouterLink to="/admin">Admin</RouterLink>
                    </NavigationMenuLink>
                </NavigationMenuItem>

                <!-- User Profile Dropdown -->
                <NavigationMenuItem v-if="userLoggedIn" class="relative">
                    <button @click="toggleDropdown" class="flex items-center gap-2 hover:opacity-80 transition">
                        <span class="text-gray-900 font-semibold text-sm max-w-[150px] truncate" :title="user?.nickname || user?.name">{{ user?.nickname || user?.name }}</span>
                        <svg class="w-4 h-4 text-gray-600 transition-transform" :class="{ 'rotate-180': showDropdown }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </button>
                    
                    <!-- Dropdown Menu -->
                    <div v-if="showDropdown" class="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        <RouterLink to="/profile" @click="closeDropdown" class="block px-4 py-2 text-gray-900 hover:bg-gray-50 border-b border-gray-100">
                            Profile
                        </RouterLink>
                        <button @click="handleLogout" class="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 font-semibold">
                            Logout
                        </button>
                    </div>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { RouterLink } from 'vue-router'

const emits = defineEmits(['logout'])
const { userLoggedIn, user } = defineProps(['userLoggedIn', 'user'])

const showDropdown = ref(false)

const toggleDropdown = () => {
    showDropdown.value = !showDropdown.value
}

const closeDropdown = () => {
    showDropdown.value = false
}

const handleLogout = () => {
    showDropdown.value = false
    emits('logout')
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
    if (showDropdown.value && !event.target.closest('.relative')) {
        closeDropdown()
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>
