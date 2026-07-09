import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import Icon from "./Icon";
import { useTheme } from "../contexts/ThemeContext";
import { auth, db } from "../services/firebase";
import {
  subscribeCarpool,
  subscribeRiders,
  requestSeat,
  cancelSeat,
  respondToRequest,
  closeCarpool,
  cancelCarpool,
  reopenCarpool,
  removeRider,
} from "../services/carpoolService";

/**
 * Live car-pool card rendered for a "carpool" chat message.
 */
export default function CarpoolCard({ eventId, carpoolId, currentUserName }) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const [carpool, setCarpool] = useState(null);
  const [riders, setRiders] = useState([]);
  const [driverSeatsShared, setDriverSeatsShared] = useState(0);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!eventId || !carpoolId) return;
    const a = subscribeCarpool(eventId, carpoolId, setCarpool);
    const b = subscribeRiders(eventId, carpoolId, setRiders);
    return () => {
      a();
      b();
    };
  }, [eventId, carpoolId]);

  // Driver loyalty badge (server-maintained, can't be self-inflated).
  useEffect(() => {
    if (!carpool?.driverId) return;
    getDoc(doc(db, "users", carpool.driverId)).then((s) => {
      if (s.exists()) setDriverSeatsShared(s.data().carpoolStats?.seatsShared || 0);
    });
  }, [carpool?.driverId]);

  const styles = createStyles(colors, isDark);
  if (!carpool) {
    return (
      <View style={styles.card}>
        <Text style={{ color: colors.textSecondary }}>{t("carpoolCard.loadingRide")}</Text>
      </View>
    );
  }

  // Pickup can open in maps when it came from the place picker (BUG 19).
  const mappable = !!(carpool.fromCoords || carpool.fromAddress);
  const openPickupMaps = () => {
    const q = carpool.fromCoords
      ? `${carpool.fromCoords.latitude},${carpool.fromCoords.longitude}`
      : carpool.fromAddress || carpool.from;
    if (q) Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`);
  };

  const isDriver = uid === carpool.driverId;
  const approved = riders.filter((r) => r.status === "approved");
  const pending = riders.filter((r) => r.status === "requested");
  const mine = riders.find((r) => r.userId === uid);
  const seatsLeft = Math.max(0, carpool.seatsTotal - approved.length);
  // Ride states (BUG 20): Open / Full / Closed / Cancelled.
  const cancelled = carpool.status === "cancelled";
  const isClosed = carpool.status === "closed";
  const isFull = !cancelled && !isClosed && seatsLeft === 0;
  const closed = cancelled || isClosed || seatsLeft === 0; // can't request a seat
  const stateLabel = cancelled
    ? t("carpoolCard.cancelled")
    : isClosed
      ? t("carpoolCard.closed")
      : isFull
        ? t("carpoolCard.full")
        : "";

  const confirmCancel = () =>
    Alert.alert(t("carpoolCard.cancelRideTitle"), t("carpoolCard.cancelRideMsg"), [
      { text: t("carpoolCard.keep"), style: "cancel" },
      { text: t("carpoolCard.cancelRide"), style: "destructive", onPress: () => cancelCarpool(eventId, carpoolId) },
    ]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <Icon name="car" size={11} color={colors.primary} />
          <Text style={styles.badge}>{t("carpoolCard.carPool")}{stateLabel ? ` · ${stateLabel}` : ""}</Text>
        </View>
        {isDriver && (
          <View style={styles.driverActions}>
            {(isClosed || cancelled) && (
              <TouchableOpacity onPress={() => reopenCarpool(eventId, carpoolId)}>
                <Text style={[styles.close, { color: colors.primary }]}>{t("carpoolCard.reopen")}</Text>
              </TouchableOpacity>
            )}
            {!isClosed && !cancelled && (
              <TouchableOpacity onPress={() => closeCarpool(eventId, carpoolId)}>
                <Text style={[styles.close, { color: colors.primary }]}>{t("carpoolCard.close")}</Text>
              </TouchableOpacity>
            )}
            {!cancelled && (
              <TouchableOpacity onPress={confirmCancel}>
                <Text style={[styles.close, { color: "#EF4444" }]}>{t("carpoolCard.cancelRide")}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <Text style={[styles.driver, { color: colors.text }]}>
        {t("carpoolCard.isDriving", { name: carpool.driverName })}
      </Text>
      {driverSeatsShared > 0 && (
        <Text style={[styles.loyalty, { color: colors.primary }]}>
          {t("carpoolCard.hasHelped", { count: driverSeatsShared })}
        </Text>
      )}
      <TouchableOpacity disabled={!mappable} onPress={openPickupMaps} activeOpacity={0.7}>
        <Text style={[styles.detail, { color: mappable ? colors.primary : colors.textSecondary }]}>
          <Icon name="location" size={12} color={mappable ? colors.primary : colors.textSecondary} /> {t("carpoolCard.from")}{" "}
          {carpool.from}
          {mappable ? ` · ${t("carpoolCard.openInMaps")}` : ""}
        </Text>
      </TouchableOpacity>
      {!!carpool.departureTime && (
        <Text style={[styles.detail, { color: colors.textSecondary }]}>
          <Icon name="clock" size={12} color={colors.textSecondary} /> {carpool.departureTime}
        </Text>
      )}
      {!!carpool.notes && (
        <Text style={[styles.notes, { color: colors.textTertiary }]}>{carpool.notes}</Text>
      )}
      <Text style={[styles.seats, { color: colors.text }]}>
        {t("carpoolCard.seatsLeft", { left: seatsLeft, count: carpool.seatsTotal })}
      </Text>

      {/* Driver view: pending requests */}
      {isDriver && !cancelled && pending.length > 0 && (
        <View style={styles.section}>
          {pending.map((r) => (
            <View key={r.userId} style={styles.reqRow}>
              <Text style={[styles.reqName, { color: colors.text }]} numberOfLines={1}>
                {r.name}
              </Text>
              <View style={styles.reqActions}>
                <TouchableOpacity
                  onPress={() => respondToRequest(eventId, carpoolId, r.userId, true)}
                  disabled={seatsLeft === 0}
                >
                  <Text style={[styles.approve, { color: seatsLeft === 0 ? colors.textTertiary : "#34C759" }]}>
                    {t("carpoolCard.approve")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => respondToRequest(eventId, carpoolId, r.userId, false)}>
                  <Text style={[styles.decline, { color: "#EF4444" }]}>{t("carpoolCard.decline")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Approved riders — the driver can remove any of them (BUG 20) */}
      {approved.length > 0 && !isDriver && (
        <Text style={[styles.riders, { color: colors.textSecondary }]}>
          <Icon name="successCircle" size={12} color={colors.success} />{" "}
          {approved.map((r) => r.name).join(", ")}
        </Text>
      )}
      {approved.length > 0 && isDriver && (
        <View style={styles.section}>
          {approved.map((r) => (
            <View key={r.userId} style={styles.reqRow}>
              <Text style={[styles.reqName, { color: colors.text }]} numberOfLines={1}>
                <Icon name="successCircle" size={12} color={colors.success} /> {r.name}
              </Text>
              <TouchableOpacity onPress={() => removeRider(eventId, carpoolId, r.userId)}>
                <Text style={[styles.decline, { color: "#EF4444" }]}>{t("carpoolCard.remove")}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Rider actions */}
      {!isDriver && (
        <View style={{ marginTop: 10 }}>
          {cancelled ? (
            <Text style={[styles.confirmed, { color: colors.textTertiary }]}>
              {t("carpoolCard.rideCancelled")}
            </Text>
          ) : (
            <>
              {!mine && !closed && (
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: `${colors.primary}33`, borderColor: `${colors.primary}66` }]}
                  onPress={() => requestSeat(eventId, carpoolId, currentUserName)}
                >
                  <Text style={[styles.btnText, { color: colors.primary }]}>{t("carpoolCard.requestSeat")}</Text>
                </TouchableOpacity>
              )}
              {mine?.status === "requested" && (
                <TouchableOpacity
                  style={[styles.btn, { borderColor: colors.border }]}
                  onPress={() => cancelSeat(eventId, carpoolId)}
                >
                  <Text style={[styles.btnText, { color: colors.textSecondary }]}>
                    {t("carpoolCard.requestedTapToCancel")}
                  </Text>
                </TouchableOpacity>
              )}
              {mine?.status === "approved" && (
                <>
                  <Text style={[styles.confirmed, { color: "#34C759" }]}>
                    {t("carpoolCard.youreIn")}
                  </Text>
                  <TouchableOpacity
                    style={[styles.btn, { borderColor: colors.border, marginTop: 6 }]}
                    onPress={() => cancelSeat(eventId, carpoolId)}
                  >
                    <Text style={[styles.btnText, { color: colors.textSecondary }]}>
                      {t("carpoolCard.leaveSeat")}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
              {mine?.status === "declined" && (
                <Text style={[styles.confirmed, { color: colors.textTertiary }]}>
                  {t("carpoolCard.couldntFit")}
                </Text>
              )}
              {mine?.status === "removed" && (
                <Text style={[styles.confirmed, { color: colors.textTertiary }]}>
                  {t("carpoolCard.removedFromRide")}
                </Text>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}

function createStyles(colors, isDark) {
  return StyleSheet.create({
    card: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: `${colors.primary}40`,
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.92)",
      padding: 14,
      width: 270,
    },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    badgeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    badge: { fontSize: 11, fontWeight: "800", color: colors.primary, letterSpacing: 0.5 },
    driverActions: { flexDirection: "row", alignItems: "center", gap: 12 },
    close: { fontSize: 13, fontWeight: "700" },
    driver: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
    loyalty: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
    detail: { fontSize: 13, marginBottom: 4 },
    notes: { fontSize: 13, fontStyle: "italic", marginBottom: 4 },
    seats: { fontSize: 14, fontWeight: "600", marginTop: 4 },
    section: { marginTop: 10, gap: 8 },
    reqRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    reqName: { fontSize: 14, flex: 1, marginRight: 8 },
    reqActions: { flexDirection: "row", gap: 14 },
    approve: { fontSize: 13, fontWeight: "700" },
    decline: { fontSize: 13, fontWeight: "700" },
    riders: { fontSize: 13, marginTop: 8 },
    btn: { borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
    btnText: { fontSize: 14, fontWeight: "700" },
    confirmed: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  });
}
