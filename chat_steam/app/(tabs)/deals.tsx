import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Linking,
  RefreshControl,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import axios from 'axios';

interface SteamDeal {
  title: string;
  dealID: string;
  salePrice: string;
  normalPrice: string;
  savings: string;
  metacriticScore: string;
  steamRatingPercent: string;
  steamRatingText: string;
  thumb: string;
  steamAppID: string;
}

type SortOption = 'Deal Rating' | 'Savings' | 'Recent' | 'Metacritic';

export default function DealsScreen() {
  const [deals, setDeals] = useState<SteamDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('Deal Rating');
  const [error, setError] = useState<string | null>(null);

  const ARS_EXCHANGE_RATE = 1500; // 1 USD = 1500 ARS (Approximate card rate + 60% taxes)

  const fetchDeals = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Fetch deals for storeID=1 (Steam) from CheapShark
      const response = await axios.get(
        `https://www.cheapshark.com/api/1.0/deals?storeID=1&pageSize=35&sortBy=${sortBy}`
      );
      
      if (Array.isArray(response.data)) {
        setDeals(response.data);
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (err: any) {
      console.error('Error fetching deals:', err.message);
      setError('No se pudieron cargar las ofertas de Steam. Comprobá tu conexión.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const handleRefresh = () => {
    fetchDeals(true);
  };

  const openDeal = (steamAppID: string, dealID: string) => {
    const url = steamAppID
      ? `https://store.steampowered.com/app/${steamAppID}`
      : `https://www.cheapshark.com/redirect?dealID=${dealID}`;
    Linking.openURL(url).catch((err) => console.error('Error al abrir URL:', err));
  };

  const formatARS = (usdPriceStr: string) => {
    const usdPrice = parseFloat(usdPriceStr);
    const arsPrice = usdPrice * ARS_EXCHANGE_RATE;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(arsPrice);
  };

  const renderDealItem = ({ item }: { item: SteamDeal }) => {
    const discountPercent = Math.round(parseFloat(item.savings));
    const isFree = parseFloat(item.salePrice) === 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => openDeal(item.steamAppID, item.dealID)}
      >
        {/* Thumbnail */}
        <Image
          source={{ uri: item.thumb }}
          style={styles.thumbnail}
          resizeMode="cover"
        />

        {/* Info Area */}
        <View style={styles.cardContent}>
          <Text style={styles.gameTitle} numberOfLines={1}>
            {item.title}
          </Text>
          
          {/* Ratings Row */}
          <View style={styles.ratingsRow}>
            {item.steamRatingPercent && item.steamRatingPercent !== '0' && (
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>
                  👍 {item.steamRatingPercent}%
                </Text>
              </View>
            )}
            {item.metacriticScore && item.metacriticScore !== '0' && (
              <View style={[styles.ratingBadge, styles.metacriticBadge]}>
                <Text style={styles.ratingText}>
                  Ⓜ️ {item.metacriticScore}
                </Text>
              </View>
            )}
          </View>

          {/* Pricing Row */}
          <View style={styles.priceContainer}>
            {/* Discount Percentage Block */}
            {discountPercent > 0 && (
              <View style={styles.discountBlock}>
                <Text style={styles.discountText}>-{discountPercent}%</Text>
              </View>
            )}

            {/* Prices */}
            <View style={styles.priceDetails}>
              {/* USD Prices */}
              <View style={styles.row}>
                <Text style={styles.normalPriceUSD}>${item.normalPrice}</Text>
                <Text style={styles.salePriceUSD}>
                  {isFree ? 'Gratis' : `U$S ${item.salePrice}`}
                </Text>
              </View>
              {/* Estimated ARS Prices */}
              {!isFree && (
                <Text style={styles.priceARS}>
                  ≈ {formatARS(item.salePrice)} <Text style={styles.arsLabel}>ARS (tarjeta)</Text>
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Arrow Button */}
        <View style={styles.arrowContainer}>
          <IconSymbol size={18} name="chevron.right" color="#66c0f4" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderSortChip = (label: string, option: SortOption) => {
    const isActive = sortBy === option;
    return (
      <TouchableOpacity
        key={option}
        style={[styles.chip, isActive && styles.chipActive]}
        onPress={() => setSortBy(option)}
        activeOpacity={0.7}
      >
        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <IconSymbol size={24} name="tag.fill" color="#66c0f4" />
        <Text style={styles.headerTitle}>Ofertas Especiales</Text>
      </View>

      {/* Sorting Chips Filter Row */}
      <View style={styles.filtersRow}>
        {renderSortChip('🔥 Mejores Ofertas', 'Deal Rating')}
        {renderSortChip('💸 Más Ahorro', 'Savings')}
        {renderSortChip('🆕 Recientes', 'Recent')}
        {renderSortChip('⭐ Crítica', 'Metacritic')}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#66c0f4" />
          <Text style={styles.loadingText}>Cargando ofertas de Steam...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchDeals()}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={deals}
          keyExtractor={(item) => item.dealID}
          renderItem={renderDealItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#66c0f4"
              colors={['#66c0f4']}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No se encontraron ofertas en este momento.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1b2838', // Steam Classic Blue-Gray Dark
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#171a21', // Steam Outer Space Black
    borderBottomWidth: 1,
    borderBottomColor: '#2a475e', // Steam Slate Blue
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 10,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#171a21',
    borderBottomWidth: 1,
    borderBottomColor: '#2a475e',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#2a475e',
  },
  chipActive: {
    backgroundColor: '#66c0f4', // Steam active light blue
  },
  chipText: {
    color: '#c7d5e0',
    fontSize: 12.5,
    fontWeight: 'bold',
  },
  chipTextActive: {
    color: '#171a21', // Dark text on active light-blue background
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#171a21',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a475e',
    marginBottom: 10,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  thumbnail: {
    width: 90,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#1b2838',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  gameTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  ratingsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  ratingBadge: {
    backgroundColor: '#2a475e',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  metacriticBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 0.5,
    borderColor: '#38bdf8',
  },
  ratingText: {
    fontSize: 10.5,
    color: '#c7d5e0',
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  discountBlock: {
    backgroundColor: '#4c6c2c', // Steam Discount Green
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  discountText: {
    color: '#a3cf06', // Steam Discount Neon Green
    fontWeight: 'bold',
    fontSize: 13,
  },
  priceDetails: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  normalPriceUSD: {
    color: '#a3a3a3',
    textDecorationLine: 'line-through',
    fontSize: 11.5,
  },
  salePriceUSD: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  priceARS: {
    color: '#a3cf06',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 1,
  },
  arsLabel: {
    color: '#a3a3a3',
    fontWeight: 'normal',
    fontSize: 10,
  },
  arrowContainer: {
    paddingLeft: 6,
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#66c0f4',
    fontSize: 14.5,
    marginTop: 10,
    fontWeight: '500',
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#66c0f4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#171a21',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyText: {
    color: '#c7d5e0',
    fontSize: 14.5,
    textAlign: 'center',
  },
});
