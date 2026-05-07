import { auth, db } from './firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import {
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    onSnapshot,
    query,
    orderBy,
    deleteDoc,
    where,
    limit,
    arrayUnion
} from 'firebase/firestore';
import { User, UserRole, TicketStatus } from '../types';

// Helper to map Firestore docs to objects
const mapDoc = (doc: any) => ({ id: doc.id, ...doc.data() });

export const api = {
    // TEAM MANAGEMENT
    createTeam: async (name: string, passkey: string = '') => {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Not authenticated");

        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data() as User;
        if (!userData.branchId) throw new Error("System Error: No Branch ID found for user.");

        // Check uniqueness within branch? Or global uniqueness for team names?
        // Let's enforce global uniqueness for simplicity or branch-scoped if preferred. 
        // For now, keeping global unique team name to avoid confusion.
        const q = query(collection(db, "teams"), where("name", "==", name));
        const snap = await getDocs(q);
        if (!snap.empty) throw new Error("Team name already exists");

        // Generate a random passkey if not provided
        const finalPasskey = passkey || Math.random().toString(36).slice(-8).toUpperCase();

        const newTeam: any = {
            name,
            passkey: finalPasskey,
            leaderId: currentUser.uid,
            branchId: userData.branchId, // Link team to branch
            createdAt: Date.now()
        };
        const docRef = await addDoc(collection(db, "teams"), newTeam);

        await updateDoc(doc(db, "users", currentUser.uid), {
            teamId: docRef.id
        });

        return { id: docRef.id, ...newTeam };
    },

    subscribeToUsers: (callback: (users: User[]) => void) => {
        let unsubscribe: (() => void) | null = null;
        let isCancelled = false;

        (async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (isCancelled) return;

            const userData = userDoc.data() as User;
            let q;

            if (userData.role === UserRole.ADMIN) {
                q = query(collection(db, "users"), where("branchId", "==", userData.branchId));
            } else {
                if (!userData.teamId) {
                    q = query(collection(db, "users"),
                        where("branchId", "==", userData.branchId),
                        where("role", "==", UserRole.ADMIN)
                    );
                } else {
                    q = query(collection(db, "users"), where("branchId", "==", userData.branchId));
                }
            }

            unsubscribe = onSnapshot(q, (snapshot) => {
                if (isCancelled) return;
                const users = snapshot.docs.map(mapDoc) as User[];
                if (userData.role === UserRole.ADMIN) {
                    callback(users);
                } else {
                    const filtered = users.filter(u => u.teamId === userData.teamId || u.role === UserRole.ADMIN);
                    callback(filtered);
                }
            });
        })();

        return () => {
            isCancelled = true;
            if (unsubscribe) unsubscribe();
        };
    },

    // BRANCH MANAGEMENT
    // Helper to resolve Branch ID (with robustness for missing links)
    _resolveBranchId: async (userId: string) => {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        let branchId = userDoc.data()?.branchId;

        // Fallback: Find branch by adminId if not linked in user profile
        if (!branchId) {
            const q = query(collection(db, "branches"), where("adminId", "==", userId));
            const snap = await getDocs(q);
            if (!snap.empty) {
                branchId = snap.docs[0].id;
                // Self-heal: Link branch to user
                await updateDoc(userRef, { branchId });
            }
        }
        return branchId;
    },

    getMyBranch: async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return null;

        // Use robust resolution
        // Note: We can't use 'this' easily in simple object literal if not defined as class or strict structure, 
        // so we'll inline the logic or define function outside. 
        // Let's just inline the robust logic here since we can't easily add a private helper in this object structure without 'this' issues.

        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        let branchId = userDoc.data()?.branchId;

        if (!branchId) {
            const q = query(collection(db, "branches"), where("adminId", "==", currentUser.uid));
            const snap = await getDocs(q);
            if (!snap.empty) {
                branchId = snap.docs[0].id;
                await updateDoc(userRef, { branchId });
            }
        }

        if (!branchId) return null;

        const branchDoc = await getDoc(doc(db, "branches", branchId));
        return { id: branchDoc.id, ...branchDoc.data() } as { id: string; passkey: string; name: string; };
    },

    updateBranchPasskey: async (newPasskey: string) => {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Not authenticated");

        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        let branchId = userDoc.data()?.branchId;

        if (!branchId) {
            const q = query(collection(db, "branches"), where("adminId", "==", currentUser.uid));
            const snap = await getDocs(q);
            if (!snap.empty) {
                branchId = snap.docs[0].id;
                await updateDoc(userRef, { branchId });
            }
        }

        if (!branchId) throw new Error("No Organization Branch found for this Admin. Please create a new account.");

        await updateDoc(doc(db, "branches", branchId), { passkey: newPasskey });
    },

    getTeams: async () => {
        // This likely won't be used directly by UI anymore, subscriptions are preferred
        const currentUser = auth.currentUser;
        if (!currentUser) return [];
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const branchId = userDoc.data()?.branchId;

        const q = query(collection(db, "teams"), where("branchId", "==", branchId));
        const snap = await getDocs(q);
        return snap.docs.map(mapDoc);
    },

    subscribeToTeams: (callback: (teams: any[]) => void) => {
        let unsubscribe: (() => void) | null = null;
        let isCancelled = false;

        (async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (isCancelled) return;
            const userData = userDoc.data() as User;
            if (userData.branchId) {
                const q = query(collection(db, "teams"), where("branchId", "==", userData.branchId));
                unsubscribe = onSnapshot(q, (snap) => {
                    if (isCancelled) return;
                    callback(snap.docs.map(mapDoc));
                });
            } else {
                callback([]);
            }
        })();

        return () => {
            isCancelled = true;
            if (unsubscribe) unsubscribe();
        };
    },

    // BETTER SIGNATURE:
    subscribeToBranchTeams: (branchId: string, callback: (teams: any[]) => void) => {
        const q = query(collection(db, "teams"), where("branchId", "==", branchId));
        return onSnapshot(q, (snap) => callback(snap.docs.map(mapDoc)));
    },

    subscribeToBranchUsers: (branchId: string, callback: (users: User[]) => void) => {
        const q = query(collection(db, "users"), where("branchId", "==", branchId));
        return onSnapshot(q, (snap) => callback(snap.docs.map(mapDoc) as User[]));
    },

    // Legacy signatures for compatibility (will update callsites)


    deleteTeam: async (teamId: string) => {
        await deleteDoc(doc(db, "teams", teamId));
        return { success: true };
    },

    updateTeam: async (teamId: string, data: Partial<{ name: string; passkey: string }>) => {
        await updateDoc(doc(db, "teams", teamId), data);
        return { success: true };
    },

    getMyTeam: async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Not authenticated");

        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data() as User;

        if (!userData.teamId) return null;

        const teamDoc = await getDoc(doc(db, "teams", userData.teamId));
        if (!teamDoc.exists()) return null;

        return { id: teamDoc.id, ...teamDoc.data() } as any;
    },

    // AUTH
    register: async (data: any) => {
        try {
            // 1. Create Auth User FIRST (to gain read access if rules require auth)
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const firebaseUser = userCredential.user;

            try {
                let teamId = null;
                let isApproved = true; // Default approved unless Leader
                let requestedTeamName = null;

                let branchId = null;

                // 2. Perform Validation Checks

                // ADMIN REGISTRATION (New Branch)
                if (data.role === UserRole.ADMIN) {
                    if (!data.branchName) throw new Error("Organization/Branch Name is required.");

                    // Create Branch
                    const newBranch = {
                        name: data.branchName,
                        adminId: firebaseUser.uid,
                        passkey: 'ADMIN' + Math.floor(1000 + Math.random() * 9000), // Default unique passkey
                        createdAt: Date.now()
                    };
                    const branchRef = await addDoc(collection(db, "branches"), newBranch);
                    branchId = branchRef.id;

                    isApproved = true;
                    teamId = null;
                }

                // TEAM LEADER REGISTRATION (Find Branch by Key)
                else if (data.role === UserRole.TEAM_LEADER) {
                    if (!data.adminPasskey) throw new Error("Admin Passkey is required.");

                    // Find Branch by Passkey
                    const q = query(collection(db, "branches"), where("passkey", "==", data.adminPasskey));
                    const snap = await getDocs(q);

                    if (snap.empty) throw new Error("Invalid Admin Passkey. No matching branch found.");

                    const branchDoc = snap.docs[0];
                    branchId = branchDoc.id;

                    // Validated by key, but waiting for Branch Admin Approval
                    isApproved = false;
                    teamId = null;
                    requestedTeamName = null;
                }

                // MEMBER REGISTRATION (Find Team -> Branch)
                else if (data.role === UserRole.MEMBER) {
                    if (!data.teamPasskey) throw new Error("Team Passkey is required.");

                    const q = query(collection(db, "teams"), where("passkey", "==", data.teamPasskey));
                    const snap = await getDocs(q);
                    if (snap.empty) throw new Error("Invalid Team Passkey.");

                    const teamData = snap.docs[0].data();
                    teamId = snap.docs[0].id;
                    branchId = teamData.branchId; // Inherit Branch
                    isApproved = false;
                }

                if (!branchId && data.role !== UserRole.ADMIN) throw new Error("Branch Association Failed. Please try again.");

                // 3. Write User Profile
                const newUser: User = {
                    id: firebaseUser.uid,
                    email: data.email,
                    name: data.name || data.email.split('@')[0],
                    role: data.role || UserRole.MEMBER,
                    teamId: teamId || null,
                    branchId: branchId || undefined, // STORE BRANCH ID
                    isActive: true,
                    isApproved: isApproved,
                    requestedTeamName: requestedTeamName,
                    avatar: `https://ui-avatars.com/api/?name=${data.name || 'User'}&background=random`
                };

                await setDoc(doc(db, "users", firebaseUser.uid), newUser);

                return {
                    user: newUser,
                    accessToken: await firebaseUser.getIdToken(),
                    refreshToken: firebaseUser.refreshToken
                };

            } catch (innerError: any) {
                // ROLLBACK: Delete the Auth user if DB checks fail
                // This prevents "zombie" accounts in Auth that don't have a specific Firestore doc
                await firebaseUser.delete();
                throw innerError;
            }

        } catch (error: any) {
            console.error("Registration error:", error);
            throw new Error(error.message || "Registration failed");
        }
    },

    // ADMIN ONLY: Approve Leader & Create Team
    approveLeaderRequest: async (leaderId: string, requestedName: string) => {
        // Double check uniqueness
        const q = query(collection(db, "teams"), where("name", "==", requestedName));
        const snap = await getDocs(q);
        if (!snap.empty) throw new Error("Team Name already taken or Team already exists.");

        // Generate Passkey
        const passkey = Math.random().toString(36).slice(-8).toUpperCase();

        // Create Team
        const teamRef = await addDoc(collection(db, "teams"), {
            name: requestedName,
            passkey,
            leaderId,
            createdAt: Date.now()
        });

        // Update Leader User
        await updateDoc(doc(db, "users", leaderId), {
            isApproved: true,
            isActive: true, // Ensure active
            teamId: teamRef.id, // Link to new team
            role: "TEAM_LEADER", // Ensure role
            requestedTeamName: "APPROVED" // Mark as approved/cleared. Deleting might be needed but string is safer for types
        });

        return { success: true, passkey };
    },

    // LEADER: Approve Member
    approveMemberRequest: async (memberId: string) => {
        await updateDoc(doc(db, "users", memberId), {
            isApproved: true,
            isActive: true
        });
        return { success: true };
    },

    login: async (data: any) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
            const firebaseUser = userCredential.user;

            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
            if (!userDoc.exists()) {
                throw new Error("User profile not found");
            }

            const user = { id: userDoc.id, ...userDoc.data() } as User;

            // Team Check: Just ensure team exists if assigned, but no Passkey check needed for Login.
            // Requirement Update: "Regular Login... using only: Email, Password"
            if (user.role !== UserRole.ADMIN && user.teamId) {
                const teamDoc = await getDoc(doc(db, "teams", user.teamId));
                if (!teamDoc.exists()) {
                    // This is a rare edge case: User has teamId but team deleted?
                    // We might want to clear the teamId or throw error.
                    // For now, let's allow login but they will see empty data.
                    // throw new Error("Assigned Team not found."); 
                }
            }

            return {
                user,
                accessToken: await firebaseUser.getIdToken(),
                refreshToken: firebaseUser.refreshToken
            };
        } catch (error: any) {
            console.error("Login error:", error);
            throw new Error(error.message || "Login failed");
        }
    },

    logout: async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('teamsync_access_token');
            localStorage.removeItem('teamsync_refresh_token');
        } catch (error) {
            console.error("Logout error:", error);
        }
    },

    getMe: async (): Promise<User> => {
        return new Promise((resolve, reject) => {
            const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
                unsubscribe();
                if (firebaseUser) {
                    try {
                        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                        if (userDoc.exists()) {
                            resolve({ id: userDoc.id, ...userDoc.data() } as User);
                        } else {
                            reject(new Error("User profile not found"));
                        }
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    reject(new Error("Not authenticated"));
                }
            });
        });
    },

    // USER MANAGEMENT
    getUsers: async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return [];
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data() as User;

        if (userData.role === UserRole.ADMIN) {
            const querySnapshot = await getDocs(query(collection(db, "users"), where("branchId", "==", userData.branchId)));
            return querySnapshot.docs.map(mapDoc);
        } else {
            if (!userData.teamId) return [];
            const q = query(collection(db, "users"), where("teamId", "==", userData.teamId));
            const snap = await getDocs(q);
            return snap.docs.map(mapDoc);
        }
    },

    toggleApproval: async (userId: string, isApproved: boolean) => {
        await updateDoc(doc(db, "users", userId), { isApproved });
        return { success: true };
    },

    deleteUser: async (userId: string) => {
        // Warning: Deleting from Firestore requires proper import if used dynamically
        // But here we rely on the top-level import
        await deleteDoc(doc(db, "users", userId));
        return { success: true };
    },

    updateUser: async (userId: string, data: Partial<User>) => {
        await updateDoc(doc(db, "users", userId), data);
        return { success: true };
    },

    getStats: async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return { users: 0, openTickets: 0, messages: 0 };
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data() as User;

        if (userData.role === UserRole.ADMIN) {
            const usersSnap = await getDocs(query(collection(db, "users"), where("branchId", "==", userData.branchId)));
            const ticketsSnap = await getDocs(query(collection(db, "tickets"), where("branchId", "==", userData.branchId)));
            const messagesSnap = await getDocs(query(collection(db, "messages"), where("branchId", "==", userData.branchId)));
            return {
                users: usersSnap.size,
                openTickets: ticketsSnap.docs.filter(d => d.data().status !== TicketStatus.COMPLETE).length,
                messages: messagesSnap.size
            };
        } else {
            const bid = userData.branchId;
            const usersQ = query(collection(db, "users"), where("branchId", "==", bid), where("teamId", "==", userData.teamId));
            const ticketsQ = query(collection(db, "tickets"), where("branchId", "==", bid), where("teamId", "==", userData.teamId));
            const msgsQ = query(collection(db, "messages"), where("branchId", "==", bid), where("teamId", "==", userData.teamId));

            const [users, tickets, msgs] = await Promise.all([getDocs(usersQ), getDocs(ticketsQ), getDocs(msgsQ)]);

            return {
                users: users.size,
                openTickets: tickets.docs.filter(d => d.data().status !== TicketStatus.COMPLETE).length,
                messages: msgs.size
            };
        }
    },

    // MESSAGING
    getMessages: async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return [];
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data() as User;

        let q;
        if (userData.role === UserRole.ADMIN) {
            q = query(collection(db, "messages"), where("branchId", "==", userData.branchId));
        } else {
            if (!userData.teamId) return [];
            q = query(collection(db, "messages"), 
                where("branchId", "==", userData.branchId),
                where("teamId", "in", [userData.teamId, `admin_global_${userData.branchId}`])
            );
        }

        const querySnapshot = await getDocs(q);
        const msgs = querySnapshot.docs.map(mapDoc);
        // Client-side sort
        msgs.sort((a: any, b: any) => a.timestamp - b.timestamp);
        return msgs;
    },

    subscribeToMessages: (callback: (messages: any[]) => void) => {
        let unsubscribe: (() => void) | null = null;
        let isCancelled = false;

        (async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (isCancelled) return;
            const userData = userDoc.data() as User;
            let q;

            if (userData.role === UserRole.ADMIN) {
                q = query(collection(db, "messages"), where("branchId", "==", userData.branchId));
            } else {
                if (!userData.teamId) {
                    callback([]);
                    return;
                }
                q = query(collection(db, "messages"),
                    where("branchId", "==", userData.branchId),
                    where("teamId", "in", [userData.teamId, `admin_global_${userData.branchId}`])
                );
            }

            unsubscribe = onSnapshot(q, (snapshot) => {
                if (isCancelled) return;
                const msgs = snapshot.docs.map(mapDoc);
                msgs.sort((a: any, b: any) => a.timestamp - b.timestamp);
                callback(msgs);
            }, (error) => {
                console.warn("Message subscription warning:", error);
            });
        })();

        return () => {
            isCancelled = true;
            if (unsubscribe) unsubscribe();
        };
    },

    sendMessage: async (text: string, recipientId?: string, options?: { replyToId?: string, forwardedFrom?: string, attachment?: any }) => {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Not authenticated");

        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data() as User;

        if (!userData.teamId && userData.role !== UserRole.ADMIN) throw new Error("No Team Assigned");

        const newMessage: any = {
            text,
            senderId: currentUser.uid,
            senderName: userData?.name || 'Unknown',
            timestamp: Date.now(),
            teamId: userData.teamId || `admin_global_${userData.branchId}`,
            branchId: userData.branchId,
            isBot: false,
            ...options
        };

        if (recipientId) {
            // Direct Message
            newMessage.chatType = 'dm';
            newMessage.recipientId = recipientId;
            newMessage.chatId = [currentUser.uid, recipientId].sort().join('_');
        } else {
            // Group Message
            newMessage.chatType = 'group';
            newMessage.chatId = 'general';
        }

        const docRef = await addDoc(collection(db, "messages"), newMessage);
        return { id: docRef.id, ...newMessage };
    },

    editMessage: async (messageId: string, newText: string) => {
        const docRef = doc(db, "messages", messageId);
        await updateDoc(docRef, { text: newText, isEdited: true });
    },

    deleteMessageForEveryone: async (messageId: string) => {
        const docRef = doc(db, "messages", messageId);
        await updateDoc(docRef, { isDeleted: true, text: "This message was deleted." });
    },

    deleteMessageForMe: async (messageId: string) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        const docRef = doc(db, "messages", messageId);
        // We use arrayUnion to add the user's ID to the deletedFor array
        await updateDoc(docRef, {
            deletedFor: arrayUnion(currentUser.uid)
        });
    },

    togglePinMessage: async (messageId: string, isPinned: boolean, expiresAt?: number) => {
        const docRef = doc(db, "messages", messageId);
        const updateData: any = { isPinned };
        if (expiresAt) updateData.pinExpiresAt = expiresAt;
        if (!isPinned) updateData.pinExpiresAt = null;
        await updateDoc(docRef, updateData);
    },

    // TICKETS
    getTickets: async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return [];
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data() as User;

        if (userData.role === UserRole.ADMIN) {
            const snap = await getDocs(query(collection(db, "tickets"), where("branchId", "==", userData.branchId)));
            return snap.docs.map(mapDoc);
        } else {
            if (!userData.teamId) return [];
            const q = query(collection(db, "tickets"), 
                where("branchId", "==", userData.branchId),
                where("teamId", "in", [userData.teamId, `admin_global_${userData.branchId}`])
            );
            const snap = await getDocs(q);
            return snap.docs.map(mapDoc);
        }
    },

    subscribeToTickets: (callback: (tickets: any[]) => void) => {
        let unsubscribe: (() => void) | null = null;
        let isCancelled = false;

        (async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (isCancelled) return;
            const userData = userDoc.data() as User;
            let q;

            if (userData.role === UserRole.ADMIN) {
                q = query(collection(db, "tickets"), where("branchId", "==", userData.branchId));
            } else {
                if (!userData.teamId) {
                    callback([]);
                    return;
                }
                q = query(collection(db, "tickets"),
                    where("branchId", "==", userData.branchId),
                    where("teamId", "in", [userData.teamId, `admin_global_${userData.branchId}`])
                );
            }

            unsubscribe = onSnapshot(q, (snapshot) => {
                if (isCancelled) return;
                callback(snapshot.docs.map(mapDoc));
            });
        })();

        return () => {
            isCancelled = true;
            if (unsubscribe) unsubscribe();
        };
    },

    createTicket: async (data: { title: string, description: string, priority: string }) => {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Not authenticated");

        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data() as User;

        if (!userData.teamId && userData.role !== UserRole.ADMIN) throw new Error("No Team Assigned");

        const newTicket = {
            ...data,
            status: TicketStatus.STARTED,
            assignedTo: currentUser.uid,
            teamId: userData.teamId || `admin_global_${userData.branchId}`,
            branchId: userData.branchId,
            createdAt: Date.now()
        };

        const docRef = await addDoc(collection(db, "tickets"), newTicket);
        return { id: docRef.id, ...newTicket };
    },

    updateTicketStatus: async (ticketId: string, status: string) => {
        await updateDoc(doc(db, "tickets", ticketId), { status });
        return { success: true };
    },

    deleteTicket: async (ticketId: string) => {
        await deleteDoc(doc(db, "tickets", ticketId));
        return { success: true };
    },

    // POLLS
    subscribeToPolls: (callback: (polls: any[]) => void) => {
        let unsubscribe: (() => void) | null = null;
        let isCancelled = false;

        (async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (isCancelled) return;
            const userData = userDoc.data() as User;
            let q;

            if (userData.role !== UserRole.ADMIN && !userData.teamId) {
                callback([]);
                return;
            }

            if (userData.role === UserRole.ADMIN) {
                q = query(collection(db, "polls"), where("branchId", "==", userData.branchId));
            } else {
                q = query(collection(db, "polls"),
                    where("branchId", "==", userData.branchId),
                    where("teamId", "in", [userData.teamId, `admin_global_${userData.branchId}`])
                );
            }

            unsubscribe = onSnapshot(q, (snapshot: any) => {
                if (isCancelled) return;
                const polls = snapshot.docs.map(mapDoc);
                polls.sort((a: any, b: any) => b.createdAt - a.createdAt);
                callback(polls);
            }, (error: any) => {
                console.error("Error subscribing to polls:", error);
            });
        })();

        return () => {
            isCancelled = true;
            if (unsubscribe) unsubscribe();
        };
    },

    createPoll: async (pollData: any) => {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Not authenticated");

        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data() as User;

        if (userData.role === UserRole.MEMBER) throw new Error("Members cannot create polls");
        if (!userData.teamId && userData.role !== UserRole.ADMIN) throw new Error("No Team Assigned");

        const newPoll = {
            ...pollData,
            createdBy: currentUser.uid,
            createdAt: Date.now(),
            teamId: userData.teamId || `admin_global_${userData.branchId}`,
            branchId: userData.branchId,
            votes: []
        };
        delete newPoll.id;

        const docRef = await addDoc(collection(db, "polls"), newPoll);
        return { id: docRef.id, ...newPoll };
    },

    deletePoll: async (pollId: string) => {
        await deleteDoc(doc(db, "polls", pollId));
        return { success: true };
    },

    updatePoll: async (pollId: string, data: any) => {
        await updateDoc(doc(db, "polls", pollId), data);
        return { success: true };
    },

    votePoll: async (pollId: string, votes: any[]) => {
        await updateDoc(doc(db, "polls", pollId), { votes });
        return { success: true };
    },

    // REMINDERS
    getReminders: async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return [];
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data() as User;

        if (userData.role === UserRole.ADMIN) {
            const snap = await getDocs(query(collection(db, "reminders"), where("branchId", "==", userData.branchId)));
            return snap.docs.map(mapDoc);
        } else {
            if (!userData.teamId) return [];
            const q = query(collection(db, "reminders"), 
                where("branchId", "==", userData.branchId),
                where("teamId", "in", [userData.teamId, `admin_global_${userData.branchId}`])
            );
            const snap = await getDocs(q);
            return snap.docs.map(mapDoc);
        }
    },

    subscribeToReminders: (callback: (reminders: any[]) => void) => {
        let unsubscribe: (() => void) | null = null;
        let isCancelled = false;

        (async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (isCancelled) return;
            const userData = userDoc.data() as User;
            let q;

            if (userData.role === UserRole.ADMIN) {
                q = query(collection(db, "reminders"), where("branchId", "==", userData.branchId));
            } else {
                if (!userData.teamId) {
                    callback([]);
                    return;
                }
                q = query(collection(db, "reminders"),
                    where("branchId", "==", userData.branchId),
                    where("teamId", "in", [userData.teamId, `admin_global_${userData.branchId}`])
                );
            }

            unsubscribe = onSnapshot(q, (snapshot) => {
                if (isCancelled) return;
                callback(snapshot.docs.map(mapDoc));
            });
        })();

        return () => {
            isCancelled = true;
            if (unsubscribe) unsubscribe();
        };
    },

    createReminder: async (data: { title: string, dueDate: string }) => {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Not authenticated");
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data() as User;

        const newReminder = {
            ...data,
            completed: false,
            userId: currentUser.uid,
            teamId: userData.teamId || `admin_global_${userData.branchId}`,
            branchId: userData.branchId,
            createdAt: Date.now()
        };
        const docRef = await addDoc(collection(db, "reminders"), newReminder);
        return { id: docRef.id, ...newReminder };
    },

    updateReminder: async (id: string, data: any) => {
        await updateDoc(doc(db, "reminders", id), data);
        return { success: true };
    },

    deleteReminder: async (id: string) => {
        await deleteDoc(doc(db, "reminders", id));
        return { success: true };
    },

    // SCHEDULE
    getSchedule: async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return [];
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data() as User;

        if (userData.role === UserRole.ADMIN) {
            const snap = await getDocs(query(collection(db, "schedule"), where("branchId", "==", userData.branchId)));
            return snap.docs.map(mapDoc);
        } else {
            if (!userData.teamId) return [];
            const q = query(collection(db, "schedule"), 
                where("branchId", "==", userData.branchId),
                where("teamId", "in", [userData.teamId, `admin_global_${userData.branchId}`])
            );
            const snap = await getDocs(q);
            return snap.docs.map(mapDoc);
        }
    },

    subscribeToSchedule: (callback: (events: any[]) => void) => {
        let unsubscribe: (() => void) | null = null;
        let isCancelled = false;

        (async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (isCancelled) return;
            const userData = userDoc.data() as User;
            let q;

            if (userData.role === UserRole.ADMIN) {
                q = query(collection(db, "schedule"), where("branchId", "==", userData.branchId));
            } else {
                if (!userData.teamId) {
                    callback([]);
                    return;
                }
                q = query(collection(db, "schedule"),
                    where("branchId", "==", userData.branchId),
                    where("teamId", "in", [userData.teamId, `admin_global_${userData.branchId}`])
                );
            }

            unsubscribe = onSnapshot(q, (snapshot) => {
                if (isCancelled) return;
                const events = snapshot.docs.map(mapDoc);
                callback(events);
            });
        })();

        return () => {
            isCancelled = true;
            if (unsubscribe) unsubscribe();
        };
    },

    createScheduleEvent: async (data: any) => {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Not authenticated");
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data() as User;

        const newEvent = {
            ...data,
            createdBy: currentUser.uid,
            teamId: userData.teamId || `admin_global_${userData.branchId}`,
            branchId: userData.branchId,
            createdAt: Date.now()
        };
        const docRef = await addDoc(collection(db, "schedule"), newEvent);
        return { id: docRef.id, ...newEvent };
    },

    updateScheduleEvent: async (id: string, data: any) => {
        await updateDoc(doc(db, "schedule", id), data);
        return { success: true };
    },

    deleteScheduleEvent: async (id: string) => {
        await deleteDoc(doc(db, "schedule", id));
        return { success: true };
    },

    // STANDUPS: Leader-Led Model
    getActiveStandup: async (teamId: string) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return null;
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data() as User;

        try {
            const q = query(
                collection(db, "standups"),
                where("branchId", "==", userData.branchId),
                where("teamId", "in", [teamId, `admin_global_${userData.branchId}`]),
                orderBy("createdAt", "desc"),
                limit(1)
            );
            const snap = await getDocs(q);
            if (snap.empty) return null;
            return mapDoc(snap.docs[0]);
        } catch (e) {
            const q = query(collection(db, "standups"), 
                where("branchId", "==", userData.branchId),
                where("teamId", "in", [teamId, `admin_global_${userData.branchId}`])
            );
            const snap = await getDocs(q);
            const docs = snap.docs.map(mapDoc);
            docs.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
            return docs[0] || null;
        }
    },

    subscribeToActiveStandup: (teamId: string, callback: (standup: any | null) => void) => {
        let unsubscribe: (() => void) | null = null;
        let isCancelled = false;

        (async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (isCancelled) return;
            const userData = userDoc.data() as User;
            const bid = userData.branchId;
            const adminGlobalId = `admin_global_${bid}`;

            try {
                const q = query(
                    collection(db, "standups"),
                    where("branchId", "==", bid),
                    where("teamId", "in", [teamId, adminGlobalId]),
                    orderBy("createdAt", "desc"),
                    limit(1)
                );
                unsubscribe = onSnapshot(q, (snap) => {
                    if (isCancelled) return;
                    if (snap.empty) callback(null);
                    else callback(mapDoc(snap.docs[0]));
                }, (e) => {
                    if (isCancelled) return;
                    console.warn("Index missing for subscribeToActiveStandup, falling back to client sort subscription", e);
                    const qFallback = query(collection(db, "standups"),
                        where("branchId", "==", bid),
                        where("teamId", "in", [teamId, adminGlobalId])
                    );
                    unsubscribe = onSnapshot(qFallback, (snap) => {
                        if (isCancelled) return;
                        const docs = snap.docs.map(mapDoc);
                        docs.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
                        callback(docs[0] || null);
                    });
                });
            } catch (e) {
                console.error("Setup failed for active standup sub", e);
            }
        })();

        return () => {
            isCancelled = true;
            if (unsubscribe) unsubscribe();
        };
    },

    createStandupSession: async (data: { teamId: string, title: string, selectedDate: string }) => {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Not authenticated");
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data() as User;

        const newSession = {
            ...data,
            branchId: userData.branchId,
            createdBy: currentUser.uid,
            createdAt: Date.now()
        };
        const docRef = await addDoc(collection(db, "standups"), newSession);
        return { id: docRef.id, ...newSession };
    },

    subscribeToStandupResponses: (standupId: string, callback: (responses: any[]) => void) => {
        const q = query(collection(db, "standups", standupId, "responses"), orderBy("submittedAt", "asc"));
        const unsubscribe = onSnapshot(q, (snap) => {
            callback(snap.docs.map(mapDoc));
        });
        return unsubscribe;
    },

    submitStandupResponse: async (standupId: string, message: string) => {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Not authenticated");

        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data() as User;

        const response = {
            standupId,
            userId: currentUser.uid,
            userName: userData.name,
            userAvatar: userData.avatar,
            message,
            submittedAt: Date.now()
        };

        const docRef = await addDoc(collection(db, "standups", standupId, "responses"), response);
        return { id: docRef.id, ...response };
    },

    deleteStandupSession: async (standupId: string) => {
        await deleteDoc(doc(db, "standups", standupId));
        return { success: true };
    },

    updateStandupSession: async (standupId: string, data: { title: string, selectedDate: string }) => {
        await updateDoc(doc(db, "standups", standupId), data);
        return { success: true };
    },

    updateStandupResponse: async (standupId: string, responseId: string, message: string) => {
        await updateDoc(doc(db, "standups", standupId, "responses", responseId), { message });
        return { success: true };
    },

    deleteStandupResponse: async (standupId: string, responseId: string) => {
        await deleteDoc(doc(db, "standups", standupId, "responses", responseId));
        return { success: true };
    },

    // PROJECTS
    subscribeToProjects: (teamId: string, callback: (projects: any[]) => void) => {
        let unsubscribe: (() => void) | null = null;
        let isCancelled = false;

        (async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (isCancelled) return;
            const userData = userDoc.data() as User;
            const bid = userData.branchId;

            try {
                let q;
                if (teamId === `admin_global_${bid}`) {
                    q = query(collection(db, "projects"),
                        where("branchId", "==", bid),
                        orderBy("createdAt", "desc")
                    );
                } else {
                    q = query(
                        collection(db, "projects"),
                        where("branchId", "==", bid),
                        where("teamId", "in", [teamId, `admin_global_${bid}`]),
                        orderBy("createdAt", "desc")
                    );
                }
                unsubscribe = onSnapshot(q, (snap) => {
                    if (isCancelled) return;
                    callback(snap.docs.map(mapDoc));
                }, (e) => {
                    if (isCancelled) return;
                    let qFallback;
                    if (teamId === `admin_global_${bid}`) {
                        qFallback = query(collection(db, "projects"),
                            where("branchId", "==", bid)
                        );
                    } else {
                        qFallback = query(
                            collection(db, "projects"),
                            where("branchId", "==", bid),
                            where("teamId", "in", [teamId, `admin_global_${bid}`])
                        );
                    }
                    unsubscribe = onSnapshot(qFallback, (snap) => {
                        if (isCancelled) return;
                        const docs = snap.docs.map(mapDoc);
                        docs.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
                        callback(docs);
                    });
                });
            } catch (e) {
                console.error("Setup failed for projects sub", e);
            }
        })();

        return () => {
            isCancelled = true;
            if (unsubscribe) unsubscribe();
        };
    },

    createProject: async (data: any) => {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Not authenticated");
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data() as User;

        const newProject = {
            ...data,
            branchId: userData.branchId,
            createdBy: currentUser.uid,
            createdAt: Date.now()
        };
        const docRef = await addDoc(collection(db, "projects"), newProject);
        return { id: docRef.id, ...newProject };
    },

    updateProject: async (projectId: string, data: any) => {
        await updateDoc(doc(db, "projects", projectId), data);
        return { success: true };
    },

    deleteProject: async (projectId: string) => {
        await deleteDoc(doc(db, "projects", projectId));
        return { success: true };
    }
};
