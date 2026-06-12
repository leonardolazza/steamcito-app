import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Image,
  Linking,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { fetchBotResponse } from '@/steamcito/src/services/openrouter';
import axios from 'axios';

interface GameDealInfo {
  title: string;
  steamAppID: string;
  isOnSale: boolean;
  savings: number;
  salePrice: string;
  normalPrice: string;
  loading: boolean;
  error: boolean;
}

interface Message {
  sender: 'user' | 'bot';
  text: string;
  gameDeal?: GameDealInfo;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: '¡Hola! 🤖 Soy Steamcito, tu asistente inteligente de Steam. Preguntame por el juego que quieras y te daré su reseña, puntuación, jugadores activos, precios en USD/pesos y requisitos.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const formatARS = (usdPriceStr: string) => {
    const usdPrice = parseFloat(usdPriceStr);
    if (isNaN(usdPrice)) return 'N/A';
    const ARS_EXCHANGE_RATE = 1500; // 1 USD = 1500 ARS (Approximate card rate + 60% taxes)
    const arsPrice = usdPrice * ARS_EXCHANGE_RATE;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(arsPrice);
  };

  const fetchLiveDeal = async (title: string, msgIndex: number, appIDHint: string | null) => {
    try {
      let gameID = '';
      let steamAppID = appIDHint || '';

      // 1. If we have an AppID, try to query by AppID first
      if (steamAppID) {
        try {
          const idLookupRes = await axios.get(
            `https://www.cheapshark.com/api/1.0/games?steamAppID=${steamAppID}`
          );
          if (idLookupRes.data && typeof idLookupRes.data === 'object') {
            const keys = Object.keys(idLookupRes.data);
            if (keys.length > 0) {
              gameID = keys[0];
            }
          }
        } catch (e) {
          console.warn('Error querying by steamAppID:', e);
        }
      }

      // 2. If no gameID from AppID, search by title
      if (!gameID && title) {
        const searchRes = await axios.get(
          `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(title)}`
        );
        if (searchRes.data && searchRes.data.length > 0) {
          const match = searchRes.data[0];
          gameID = match.gameID;
          if (!steamAppID) {
            steamAppID = match.steamAppID || '';
          }
        }
      }

      if (!gameID) {
        throw new Error('Juego no encontrado en CheapShark');
      }

      // 3. Fetch detailed game info including active deals
      const detailRes = await axios.get(
        `https://www.cheapshark.com/api/1.0/games?id=${gameID}`
      );
      const details = detailRes.data;

      // 4. Find Steam deal (storeID = "1")
      const steamDeal = details.deals?.find((d: any) => d.storeID === '1');

      if (steamDeal) {
        const savings = parseFloat(steamDeal.savings);
        const isOnSale = savings > 0;

        setMessages((prev) => {
          const copy = [...prev];
          if (copy[msgIndex]) {
            copy[msgIndex] = {
              ...copy[msgIndex],
              gameDeal: {
                title: details.info?.title || title,
                steamAppID: steamAppID || details.info?.steamAppID || '',
                isOnSale,
                savings,
                salePrice: steamDeal.price,
                normalPrice: steamDeal.retailPrice,
                loading: false,
                error: false,
              },
            };
          }
          return copy;
        });
      } else {
        // Match found but no active Steam store deal in CheapShark database
        setMessages((prev) => {
          const copy = [...prev];
          if (copy[msgIndex]) {
            copy[msgIndex] = {
              ...copy[msgIndex],
              gameDeal: {
                title: details.info?.title || title,
                steamAppID: steamAppID || details.info?.steamAppID || '',
                isOnSale: false,
                savings: 0,
                salePrice: details.cheapestPriceEver?.price || '0.00',
                normalPrice: details.cheapestPriceEver?.price || '0.00',
                loading: false,
                error: false,
              },
            };
          }
          return copy;
        });
      }
    } catch (err) {
      console.error('Error fetching live deal:', err);
      setMessages((prev) => {
        const copy = [...prev];
        if (copy[msgIndex]) {
          copy[msgIndex] = {
            ...copy[msgIndex],
            gameDeal: {
              title,
              steamAppID: appIDHint || '',
              isOnSale: false,
              savings: 0,
              salePrice: '',
              normalPrice: '',
              loading: false,
              error: true,
            },
          };
        }
        return copy;
      });
    }
  };

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    // Add user message
    setMessages((prev) => [...prev, { sender: 'user', text: trimmedInput }]);
    setInput('');
    setLoading(true);

    try {
      const reply = await fetchBotResponse(trimmedInput);

      // Parse game title (e.g. 🎮 **Terraria**)
      const titleMatch = reply.match(/🎮\s*\*\*([^*]+)\*\*/);
      const gameTitle = titleMatch ? titleMatch[1].trim() : null;

      // Parse AppID hint (e.g. [AppID: 105600])
      const appIDMatch = reply.match(/\[AppID:\s*(\d+)\]/);
      const steamAppID = appIDMatch ? appIDMatch[1] : null;

      const botMessage: Message = { sender: 'bot', text: reply };

      if (gameTitle || steamAppID) {
        botMessage.gameDeal = {
          title: gameTitle || 'Juego de Steam',
          steamAppID: steamAppID || '',
          isOnSale: false,
          savings: 0,
          salePrice: '',
          normalPrice: '',
          loading: true,
          error: false,
        };
      }

      setMessages((prev) => {
        const next = [...prev, botMessage];
        const newMsgIndex = next.length - 1;
        
        // Trigger live deal fetch asynchronously
        if (gameTitle || steamAppID) {
          fetchLiveDeal(gameTitle || '', newMsgIndex, steamAppID);
        }
        return next;
      });
    } catch (error) {
      console.error('Error al consultar el bot:', error);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: '⚠️ Hubo un error al procesar tu consulta. Por favor, intenta de nuevo.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Scroll to the end whenever messages or loading state changes
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, loading]);

  // Helper to parse and render custom formatting (bold, list, emojis)
  const renderFormattedText = (text: string, isUser: boolean) => {
    const lines = text.split('\n');
    return lines.map((line, lineIndex) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return <View key={lineIndex} style={styles.emptyLine} />;

      // Check if it's a list item
      const isListItem = trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || trimmedLine.startsWith('• ');
      let cleanLine = trimmedLine;
      if (isListItem) {
        cleanLine = trimmedLine.substring(2).trim();
      }

      // Check if it's the game title header (e.g. starts with 🎮)
      const isHeader = trimmedLine.includes('🎮') && trimmedLine.includes('**');

      // Split by bold markdown markers (**)
      const parts = cleanLine.split('**');
      const lineContent = parts.map((part, partIndex) => {
        const isBold = partIndex % 2 === 1;
        return (
          <Text
            key={partIndex}
            style={[
              isBold ? styles.boldText : styles.normalText,
              isUser ? styles.userText : styles.botText,
              isHeader && styles.headerTextSegment,
            ]}
          >
            {part}
          </Text>
        );
      });

      return (
        <View
          key={lineIndex}
          style={[
            styles.lineWrapper,
            isListItem && styles.listItem,
            isHeader && styles.headerLine,
          ]}
        >
          {isListItem && (
            <Text style={[styles.bullet, isUser ? styles.userText : styles.botText]}>
              •{' '}
            </Text>
          )}
          <Text style={styles.lineText}>{lineContent}</Text>
        </View>
      );
    });
  };

  const renderLiveDealCard = (deal: NonNullable<Message['gameDeal']>) => {
    if (deal.loading) {
      return (
        <View style={styles.dealLoadingContainer}>
          <ActivityIndicator size="small" color="#66c0f4" />
          <Text style={styles.dealLoadingText}>Verificando precios en vivo en Steam...</Text>
        </View>
      );
    }

    if (deal.error || !deal.steamAppID) {
      return (
        <View style={styles.dealErrorContainer}>
          <Text style={styles.dealErrorText}>
            ℹ️ No se pudo verificar una oferta activa en CheapShark/Steam para este juego.
          </Text>
        </View>
      );
    }

    const discountPercent = Math.round(deal.savings);
    const isFree = parseFloat(deal.salePrice) === 0;

    return (
      <View style={styles.dealCard}>
        {/* Game Banner */}
        <Image
          source={{ uri: `https://cdn.akamai.steamstatic.com/steam/apps/${deal.steamAppID}/header.jpg` }}
          style={styles.dealImage}
          resizeMode="cover"
        />
        
        {/* Deal Info */}
        <View style={styles.dealInfo}>
          <Text style={styles.dealTitle} numberOfLines={1}>
            {deal.title}
          </Text>

          {/* Offer Status Tag */}
          {deal.isOnSale ? (
            <View style={[styles.dealStatusBadge, styles.statusOnSale]}>
              <Text style={[styles.statusText, styles.statusTextOnSale]}>
                🏷️ ¡OFERTA ACTIVA! -{discountPercent}%
              </Text>
            </View>
          ) : (
            <View style={[styles.dealStatusBadge, styles.statusRegular]}>
              <Text style={styles.statusText}>
                ❌ Sin oferta activa de momento
              </Text>
            </View>
          )}

          {/* Pricing Info */}
          <View style={styles.dealPrices}>
            {deal.isOnSale ? (
              <View style={styles.dealPriceRow}>
                <Text style={styles.dealOriginalPrice}>Normal: ${deal.normalPrice}</Text>
                <Text style={styles.dealSalePrice}>U$S {deal.salePrice}</Text>
              </View>
            ) : (
              <Text style={styles.dealSalePrice}>Precio regular: U$S {deal.normalPrice}</Text>
            )}

            {!isFree && (
              <Text style={styles.dealPriceARS}>
                ≈ {formatARS(deal.salePrice || deal.normalPrice)} <Text style={styles.arsLabel}>ARS (tarjeta)</Text>
              </Text>
            )}
          </View>

          {/* Store Redirect button */}
          <TouchableOpacity
            style={styles.dealButton}
            activeOpacity={0.8}
            onPress={() => {
              const url = `https://store.steampowered.com/app/${deal.steamAppID}`;
              Linking.openURL(url).catch((err) => console.error('Error opening Steam URL:', err));
            }}
          >
            <Text style={styles.dealButtonText}>Ver en Steam Store</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Mini Header */}
      <View style={styles.header}>
        <IconSymbol size={24} name="bubble.fill" color="#66c0f4" />
        <Text style={styles.headerTitle}>Steamcito Chat</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {messages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            
            // Extract Steam App ID if present (only for bot messages)
            let displayDetailsText = msg.text;
            
            if (!isUser) {
              // Strip any AppID tags from text so they don't display raw
              displayDetailsText = msg.text.replace(/\[AppID:\s*\d+\]/g, '').trim();
            }

            return (
              <View
                key={index}
                style={[
                  styles.bubbleContainer,
                  isUser ? styles.userContainer : styles.botContainer,
                ]}
              >
                {!isUser && (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>🤖</Text>
                  </View>
                )}
                <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
                  {renderFormattedText(displayDetailsText, isUser)}
                  {!isUser && msg.gameDeal && renderLiveDealCard(msg.gameDeal)}
                </View>
              </View>
            );
          })}

          {loading && (
            <View style={[styles.bubbleContainer, styles.botContainer]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>🤖</Text>
              </View>
              <View style={[styles.bubble, styles.botBubble, styles.loadingBubble]}>
                <ActivityIndicator size="small" color="#66c0f4" />
                <Text style={styles.loadingText}>Steamcito está buscando información...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Preguntame sobre un juego... (ej: Hades)"
            placeholderTextColor="rgba(102, 192, 244, 0.4)"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || loading}
          >
            <IconSymbol size={20} name="paperplane.fill" color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  bubbleContainer: {
    flexDirection: 'row',
    marginVertical: 6,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  botContainer: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a475e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  avatarText: {
    fontSize: 16,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    minWidth: 150, // Prevents bubble from shrinking too much when image is loaded
  },
  userBubble: {
    backgroundColor: '#107c10', // Gaming/Steam Green
    borderBottomRightRadius: 2,
  },
  botBubble: {
    backgroundColor: '#171a21', // Steam Dark Gray
    borderWidth: 1,
    borderColor: '#2a475e',
    borderBottomLeftRadius: 2,
  },
  dealCard: {
    backgroundColor: '#171a21',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a475e',
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 4,
    width: '100%',
  },
  dealImage: {
    width: '100%',
    height: 110,
  },
  dealInfo: {
    padding: 12,
  },
  dealTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  dealStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusOnSale: {
    backgroundColor: '#4c6c2c',
  },
  statusRegular: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.5,
    borderColor: '#2a475e',
  },
  statusText: {
    color: '#c7d5e0',
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusTextOnSale: {
    color: '#a3cf06',
  },
  dealPrices: {
    marginBottom: 10,
  },
  dealPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dealOriginalPrice: {
    color: '#a3a3a3',
    textDecorationLine: 'line-through',
    fontSize: 11.5,
  },
  dealSalePrice: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14.5,
  },
  dealPriceARS: {
    color: '#a3cf06',
    fontWeight: 'bold',
    fontSize: 12.5,
    marginTop: 1,
  },
  arsLabel: {
    color: '#a3a3a3',
    fontWeight: 'normal',
    fontSize: 10.5,
  },
  dealButton: {
    backgroundColor: '#66c0f4',
    paddingVertical: 8,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealButtonText: {
    color: '#171a21',
    fontSize: 12.5,
    fontWeight: 'bold',
  },
  dealLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: '#171a21',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a475e',
    marginTop: 10,
  },
  dealLoadingText: {
    color: '#66c0f4',
    fontSize: 12.5,
  },
  dealErrorContainer: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 10,
  },
  dealErrorText: {
    color: '#a3a3a3',
    fontSize: 12,
    lineHeight: 16,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#66c0f4',
    fontSize: 14,
  },
  userText: {
    color: '#ffffff',
  },
  botText: {
    color: '#c7d5e0', // Steam Light Gray text
  },
  boldText: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  normalText: {
    fontWeight: 'normal',
  },
  headerTextSegment: {
    fontSize: 17,
    color: '#66c0f4', // Highlight game titles in Steam blue
  },
  lineWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 1,
    flexWrap: 'wrap',
  },
  listItem: {
    paddingLeft: 12,
  },
  headerLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#2a475e',
    paddingBottom: 4,
    marginBottom: 6,
  },
  bullet: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  lineText: {
    flex: 1,
    fontSize: 14.5,
    lineHeight: 21,
  },
  emptyLine: {
    height: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#171a21',
    borderTopWidth: 1,
    borderTopColor: '#2a475e',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#1b2838',
    color: '#ffffff',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2a475e',
  },
  sendButton: {
    backgroundColor: '#66c0f4', // Steam Sky Blue
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#2a475e',
    opacity: 0.5,
  },
});
