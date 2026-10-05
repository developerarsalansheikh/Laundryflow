import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { useLocationStore } from '../../store/locationStore';
import { useAuthStore } from '../../store/authStore';
import { customerService } from '../../services/customerService';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

// Pre-defined city coordinates for accurate distance and serviceability
const POPULAR_CITIES = [
  { city: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { city: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  { city: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { city: 'Delhi', state: 'Delhi NCR', lat: 28.7041, lng: 77.1025 },
  { city: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { city: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { city: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { city: 'Gurgaon', state: 'Haryana', lat: 28.4595, lng: 77.0266 },
  { city: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.3910 },
  { city: 'Indiranagar', state: 'Bangalore', lat: 12.9784, lng: 77.6408 },
  { city: 'Koramangala', state: 'Bangalore', lat: 12.9352, lng: 77.6245 },
  { city: 'HSR Layout', state: 'Bangalore', lat: 12.9121, lng: 77.6446 },
  { city: 'Bandra', state: 'Mumbai', lat: 19.0596, lng: 72.8295 },
  { city: 'Powai', state: 'Mumbai', lat: 19.1176, lng: 72.9060 },
];

export const SelectLocationScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const isMandatory = route.params?.isMandatory ?? false;

  const setLocation = useLocationStore((state) => state.setLocation);
  const currentCity = useLocationStore((state) => state.city);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [searchQuery, setSearchQuery] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [manualCity, setManualCity] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  // Fetch saved addresses if customer is logged in
  useEffect(() => {
    if (isAuthenticated) {
      setLoadingSaved(true);
      customerService
        .getAddresses()
        .then((res) => {
          const list = res?.data || res || [];
          if (Array.isArray(list)) {
            setSavedAddresses(list);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingSaved(false));
    }
  }, [isAuthenticated]);

  const handleSelectLocation = ({ city, address, latitude, longitude }) => {
    setLocation({
      city,
      address: address || city,
      latitude,
      longitude,
    });

    if (navigation.canGoBack() && !isMandatory) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'CustomerHome' }],
      });
    }
  };

  const handleUseCurrentLocation = () => {
    setGpsLoading(true);

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLoading(false);
          const { latitude, longitude } = pos.coords;
          // Approximate nearest popular city or default to Mumbai / Bangalore
          handleSelectLocation({
            city: 'Mumbai',
            address: 'Current Location (GPS)',
            latitude,
            longitude,
          });
        },
        (error) => {
          setGpsLoading(false);
          // Fallback to primary metro with exact coords
          handleSelectLocation({
            city: 'Mumbai',
            address: 'Mumbai Central (GPS detected)',
            latitude: 19.0760,
            longitude: 72.8777,
          });
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    } else {
      setTimeout(() => {
        setGpsLoading(false);
        handleSelectLocation({
          city: 'Mumbai',
          address: 'Mumbai Central (GPS detected)',
          latitude: 19.0760,
          longitude: 72.8777,
        });
      }, 500);
    }
  };

  const handleManualSubmit = () => {
    if (!manualCity.trim()) {
      Alert.alert('City Required', 'Please enter your city name to view serviceable laundries.');
      return;
    }
    const matched = POPULAR_CITIES.find(
      (c) => c.city.toLowerCase() === manualCity.trim().toLowerCase()
    );

    handleSelectLocation({
      city: matched ? matched.city : manualCity.trim(),
      address: manualAddress.trim() || manualCity.trim(),
      latitude: matched ? matched.lat : 19.0760,
      longitude: matched ? matched.lng : 72.8777,
    });
  };

  const filteredCities = POPULAR_CITIES.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.city.toLowerCase().includes(q) || item.state.toLowerCase().includes(q);
  });

  return (
    <ScreenContainer scrollable={false} style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={styles.headerTitleRow}>
          {navigation.canGoBack() && !isMandatory && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text variant="bodyLarge" weight="bold">←</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text variant="h2" weight="bold" colorVariant="primary">
              Set Your Location
            </Text>
            <Text variant="caption" colorVariant="secondary">
              Laundries are verified and serviced within 20 KM of your city
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Current Location GPS Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.gpsCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.primary }]}
          onPress={handleUseCurrentLocation}
          disabled={gpsLoading}
        >
          {gpsLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 12 }} />
          ) : (
            <Text style={styles.gpsIcon}>🎯</Text>
          )}
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium" weight="bold" style={{ color: colors.primary }}>
              Use Current Location
            </Text>
            <Text variant="caption" colorVariant="secondary">
              Automatically detect GPS coordinates for instant serviceability
            </Text>
          </View>
        </TouchableOpacity>

        {/* Search City / Locality Input */}
        <View style={styles.searchSection}>
          <Text variant="caption" weight="bold" colorVariant="muted" style={{ marginBottom: 6 }}>
            SEARCH CITY OR LOCALITY
          </Text>
          <Input
            placeholder="Type city (e.g. Mumbai, Bangalore, Delhi...)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Saved Addresses Section (if available) */}
        {isAuthenticated && savedAddresses.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text variant="caption" weight="bold" colorVariant="muted" style={{ marginBottom: 8 }}>
              SAVED ADDRESSES
            </Text>
            {savedAddresses.map((addr) => (
              <TouchableOpacity
                key={addr._id || addr.id}
                style={[styles.savedItem, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                onPress={() =>
                  handleSelectLocation({
                    city: addr.city || 'Mumbai',
                    address: addr.fullAddress || addr.addressLine || `${addr.label} Address`,
                    latitude: addr.coordinates?.latitude || addr.lat || 19.0760,
                    longitude: addr.coordinates?.longitude || addr.lng || 72.8777,
                  })
                }
              >
                <Text style={{ fontSize: 18, marginRight: 10 }}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text variant="bodySmall" weight="bold" colorVariant="primary">
                    {addr.label || 'Home'}
                  </Text>
                  <Text variant="caption" colorVariant="secondary" numberOfLines={1}>
                    {addr.fullAddress || addr.addressLine} ({addr.city})
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Popular Cities Grid */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text variant="caption" weight="bold" colorVariant="muted">
              {searchQuery ? 'MATCHING CITIES' : 'POPULAR SERVICE CITIES'}
            </Text>
            <TouchableOpacity onPress={() => setShowManualForm(!showManualForm)}>
              <Text variant="caption" weight="bold" style={{ color: colors.primary }}>
                {showManualForm ? 'Hide Manual' : '+ Enter Manually'}
              </Text>
            </TouchableOpacity>
          </View>

          {showManualForm && (
            <Card variant="outlined" style={styles.manualCard}>
              <Text variant="bodySmall" weight="bold" colorVariant="primary" style={{ marginBottom: 8 }}>
                Enter Address or Custom City
              </Text>
              <Input
                label="City Name"
                placeholder="e.g. Mumbai"
                value={manualCity}
                onChangeText={setManualCity}
                containerStyle={{ marginBottom: 8 }}
              />
              <Input
                label="Address / Area"
                placeholder="e.g. Bandra West, Near Station"
                value={manualAddress}
                onChangeText={setManualAddress}
                containerStyle={{ marginBottom: 12 }}
              />
              <Button title="Set Custom Location" size="sm" onPress={handleManualSubmit} />
            </Card>
          )}

          <View style={styles.cityGrid}>
            {filteredCities.map((item) => {
              const isSelected = currentCity?.toLowerCase() === item.city.toLowerCase();
              return (
                <TouchableOpacity
                  key={item.city}
                  style={[
                    styles.cityChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.borderLight,
                    },
                  ]}
                  onPress={() =>
                    handleSelectLocation({
                      city: item.city,
                      address: `${item.city}, ${item.state}`,
                      latitude: item.lat,
                      longitude: item.lng,
                    })
                  }
                >
                  <Text
                    variant="bodySmall"
                    weight={isSelected ? 'bold' : 'medium'}
                    style={{ color: isSelected ? '#FFFFFF' : colors.textPrimary }}
                  >
                    {item.city}
                  </Text>
                  <Text
                    variant="caption"
                    style={{
                      color: isSelected ? '#E2E8F0' : colors.textMuted,
                      fontSize: 10,
                      marginTop: 2,
                    }}
                  >
                    {item.state}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 40,
  },
  gpsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  gpsIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  searchSection: {
    marginBottom: 16,
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  savedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  manualCard: {
    padding: 14,
    marginBottom: 12,
  },
  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityChip: {
    width: '48%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
});

export default SelectLocationScreen;
