"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, doc, writeBatch } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function FixPropertiesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, missing: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) fetchStats();
      else setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "property_All", "main", "properties"));
      let missingCount = 0;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.sellerId && !data.ownerId && !data.userId) {
          missingCount++;
        }
      });
      setStats({ total: querySnapshot.size, missing: missingCount });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fixProperties = async () => {
    if (!user) return;
    setProcessing(true);
    setLog([]);
    
    try {
      const querySnapshot = await getDocs(collection(db, "property_All", "main", "properties"));
      const batch = writeBatch(db);
      let count = 0;
      const newLogs: string[] = [];

      querySnapshot.forEach((d) => {
        const data = d.data();
        if (!data.sellerId && !data.ownerId && !data.userId) {
          const ref = doc(db, "property_All", "main", "properties", d.id);
          // Assign current user as seller
          batch.update(ref, { 
            sellerId: user.uid,
            sellerName: user.displayName || "Property Owner",
            updatedAt: new Date()
          });
          newLogs.push(`Updated property: ${data.title || d.id}`);
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
        setLog((prev) => [...prev, ...newLogs, `Successfully updated ${count} properties!`]);
        await fetchStats();
      } else {
        setLog((prev) => [...prev, "No properties needed updating."]);
      }
    } catch (error: unknown) {
      const err = error as Error;
      setLog((prev) => [...prev, `Error: ${err.message}`]);
    } finally {
      setProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Admin Data Fix</h1>
        <p>Please sign in to access this tool.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Fix Property Data</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold mb-4">Database Status</h2>
        {loading ? (
          <p>Scanning properties...</p>
        ) : (
          <div className="space-y-2">
            <p>Total Properties: <span className="font-bold">{stats.total}</span></p>
            <p className="text-red-600">
              Properties Missing Owner (sellerId): <span className="font-bold">{stats.missing}</span>
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <p className="text-gray-600">
          Click below to assign <strong>Your Account</strong> ({user.email}) as the owner for all properties that are currently missing an owner. 
          This will allow the chat feature to work for these properties.
        </p>
        
        <button
          onClick={fixProperties}
          disabled={processing || stats.missing === 0}
          className={`w-full py-4 px-6 rounded-lg font-bold text-white transition-colors ${
            processing || stats.missing === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {processing ? "Updating..." : `Fix ${stats.missing} Properties`}
        </button>
      </div>

      {log.length > 0 && (
        <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
          <h3 className="font-bold mb-2">Log:</h3>
          {log.map((line, i) => (
            <div key={i} className="text-sm font-mono text-gray-700">{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}
