import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
const CUISINES  = ['Indian','American','Thai','Chinese','Italian','Mexican','Japanese','Korean','Mediterranean'];
const SERVICES  = ['buffet','delivery','takeout','dine-in','outdoor','parking'];
const CATEGORIES= ['banquet','party','bar','cafe','buffet','family'];
export default function FiltersModal() {
  const router = useRouter();
//   // Read current params from URL search params (set by home screen)
//   // For simplicity we use local state + AsyncStorage or URL params.
  const [cuisine,  setCuisine]  = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [services, setServices] = useState<string[]>([]);
  const toggleService = (s: string) => {
    setServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };
  const apply = () => {
    // Push params back – the home screen reads them
    const params: Record<string,string> = {};
    if (cuisine)          params.cuisine  = cuisine;
    if (category)         params.category = category;
    if (services.length)  params.services = services.join(',');
    router.push({ pathname: '/(customer)/home', params });
  };
  const clear = () => { setCuisine(null); setCategory(null); setServices([]); };

  return (
    <View style={styles.root}>
      {/* header */}
      <View style={styles.header}>
        <Text style={styles.headerTxt}>Filters</Text>
        <TouchableOpacity onPress={() => router.back()}><X size={22} color="#94a3b8" /></TouchableOpacity>
      </View>
      <ScrollView style={styles.scroll}>
        {/* Cuisine */}
        <Text style={styles.label}>Cuisine</Text>
        <View style={styles.chipWrap}>
          {CUISINES.map(c => {
            const on = cuisine === c;
            return (
              <TouchableOpacity key={c} style={[styles.chip, on && styles.chipOn]} onPress={() => setCuisine(on ? null : c)}>
                <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{c}</Text>
              </TouchableOpacity>
             );
          })}
        </View>
        {/* Category */}
        <Text style={styles.label}>Venue Type</Text>
         <View style={styles.chipWrap}>
          {CATEGORIES.map(c => {
            const on = category === c;
            return (
              <TouchableOpacity key={c} style={[styles.chip, on && styles.chipOn]} onPress={() => setCategory(on ? null : c)}>
                <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{c.charAt(0).toUpperCase() + c.slice(1)}</Text>
              </TouchableOpacity>
            );
          })}
       </View>
        {/* Services */}
        <Text style={styles.label}>Services</Text>
        <View style={styles.chipWrap}>
          {SERVICES.map(s => {
            const on = services.includes(s);
             return (
              <TouchableOpacity key={s} style={[styles.chip, on && styles.chipOn]} onPress={() => toggleService(s)}>
                <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
       {/* footer actions */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.clearBtn} onPress={clear}><Text style={styles.clearBtnTxt}>Clear</Text></TouchableOpacity>
        <TouchableOpacity style={styles.applyBtn} onPress={apply}><Text style={styles.applyBtnTxt}>Apply</Text></TouchableOpacity>
      </View>
    </View>
  );
}
//
// const styles = StyleSheet.create({
//   root:         { flex: 1, background: '#0f172a' },
//   header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
//   headerTxt:    { color: '#f1f5f9', fontSize: 20, fontWeight: '700' as any },
//   scroll:       { flex: 1, paddingHorizontal: 20 },
//   label:        { color: '#64748b', fontSize: 13, fontWeight: '600' as any, marginTop: 20, marginBottom: 8, textTransform: 'uppercase' as any },
//   chipWrap:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
//   chip:         { background: '#1e293b', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16 },
//   chipOn:       { background: '#3b82f6' },
//   chipTxt:      { color: '#94a3b8', fontSize: 14 },
//   chipTxtOn:    { color: '#fff', fontWeight: '600' as any },
//   footer:       { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 40 },
//   clearBtn:     { flex: 1, background: '#334155', borderRadius: 12, alignItems: 'center' as any, paddingVertical: 14 },
//   clearBtnTxt:  { color: '#94a3b8', fontWeight: '600' as any },
//   applyBtn:     { flex: 2, background: '#3b82f6', borderRadius: 12, alignItems: 'center' as any, paddingVertical: 14 },
//   applyBtnTxt:  { color: '#fff', fontSize: 15, fontWeight: '700' as any },
// });
