import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLocalSearchParams, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "services/FirebaseConfig.ts";
import completedPicture from "@/assets/images/completed.png";

const FoodDetailScreen = () => {
  const params = useLocalSearchParams();
  const [isAddingToOrder, setIsAddingToOrder] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    checkIfFavorite();
  }, []);

  const checkIfFavorite = async () => {
    if (!auth.currentUser) return;

    try {
      const favoritesRef = collection(db, "favorites");
      const q = query(
        favoritesRef,
        where("userId", "==", auth.currentUser.uid),
        where("productId", "==", params.id)
      );

      const querySnapshot = await getDocs(q);
      setIsFavorite(!querySnapshot.empty);
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!auth.currentUser) {
      Alert.alert("Error", "Please login to add favorites");
      return;
    }

    try {
      const favoritesRef = collection(db, "favorites");
      const q = query(
        favoritesRef,
        where("userId", "==", auth.currentUser.uid),
        where("productId", "==", params.id)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        const favoriteData = {
          userId: auth.currentUser.uid,
          productId: params.id,
          name: params.name,
          price: parseFloat(String(params.price)),
          image: params.image,
          rating: Number(params.rating),
          description: params.description,
          ingredients: params.ingredients,
          likes: params.likes,
          storeName: params.storeName,
          createdAt: new Date(),
        };

        await addDoc(favoritesRef, favoriteData);
        setIsFavorite(true);
        Alert.alert("Success", "Added to favorites!");
      } else {
        const docToDelete = querySnapshot.docs[0];
        await deleteDoc(docToDelete.ref);
        setIsFavorite(false);
        Alert.alert("Success", "Removed from favorites!");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      Alert.alert("Error", "Failed to update favorites. Please try again.");
    }
  };

  const handleAddToOrder = async () => {
    if (!auth.currentUser) {
      Alert.alert("Error", "Please login to place an order");
      return;
    }

    setIsAddingToOrder(true);
    try {
      const orderData = {
        userId: auth.currentUser.uid,
        productId: params.id,
        quantity: 1,
        price: parseFloat(String(params.price)),
        status: "in_order",
        createdAt: new Date(),
        storeName: params.storeName,
        productName: params.name,
        productImage: params.image,
        orderNumber: `ORD${Date.now()}`,
        customerName: auth.currentUser.displayName || "Guest",
        customerEmail: auth.currentUser.email,
        totalAmount: parseFloat(String(params.price)),
      };

      const inProgressRef = collection(db, "in_progress");
      await addDoc(inProgressRef, orderData);

      Alert.alert("Success", "Item added to orders!", [
        { text: "OK", onPress: () => console.log("OK Pressed") },
      ]);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error adding to order:", error);
      Alert.alert("Error", "Failed to add item to orders. Please try again.");
    } finally {
      setIsAddingToOrder(false);
    }
  };

  if (!params) {
    return (
      <View style={styles.container}>
        <Text>Food item not found</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.imageContainer}>
          <Link href="/tabs" style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="black" />
          </Link>
          <Image source={{ uri: params.image }} style={styles.foodImage} />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.headerSection}>
            <View>
              <Text style={styles.title}>{params.name}</Text>
              <View style={styles.ratingContainer}>
                {[...Array(Math.floor(Number(params.rating)))].map(
                  (_, index) => (
                    <Ionicons
                      key={index}
                      name="star"
                      size={16}
                      color="#FFD700"
                    />
                  )
                )}
                {[...Array(5 - Math.floor(Number(params.rating)))].map(
                  (_, index) => (
                    <Ionicons
                      key={index}
                      name="star-outline"
                      size={16}
                      color="#FFD700"
                    />
                  )
                )}
                <Text style={styles.ratingText}>{params.rating}</Text>
              </View>
            </View>
            <View style={styles.likesContainer}>
              <Text style={styles.likesText}>{params.likes}</Text>
              <TouchableOpacity onPress={handleToggleFavorite}>
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={24}
                  color={isFavorite ? "red" : "black"}
                />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.description}>{params.description}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients:</Text>
            <Text style={styles.sectionContent}>{params.ingredients}</Text>
          </View>

          <View style={styles.footer}>
            <View>
              <Text style={styles.priceLabel}>Total Price</Text>
              <Text style={styles.price}>{"₱" + params.price}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.orderButton,
                isAddingToOrder && styles.orderButtonDisabled,
              ]}
              onPress={handleAddToOrder}
              disabled={isAddingToOrder}
            >
              <Text style={styles.orderButtonText}>
                {isAddingToOrder ? "Adding..." : "Add to orders"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="flex flex-col items-center">
          <AlertDialogHeader className="py-3">
            <AlertDialogTitle className="font-bold text-xl">
              Successfully Added to Orders!
            </AlertDialogTitle>
          </AlertDialogHeader>
          <Image source={completedPicture} />
          <AlertDialogFooter className="py-3">
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>
              Click to Dismiss
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 300,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 8,
  },
  foodImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  contentContainer: {
    padding: 20,
    marginTop: -20,
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    marginLeft: 5,
    color: "#666",
  },
  likesContainer: {
    alignItems: "center",
  },
  likesText: {
    marginBottom: 5,
    color: "#666",
  },
  description: {
    color: "#666",
    lineHeight: 20,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  sectionContent: {
    color: "#666",
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  priceLabel: {
    color: "#666",
    marginBottom: 5,
  },
  price: {
    fontSize: 24,
    fontWeight: "bold",
  },
  orderButton: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  orderButtonDisabled: {
    opacity: 0.5,
  },
  orderButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default FoodDetailScreen;
