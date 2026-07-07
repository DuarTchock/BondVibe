import Icon from "../components/Icon";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import GradientBackground from "../components/GradientBackground";
import DateField from "../components/DateField";
import AvailabilityCalendar from "../components/AvailabilityCalendar";
import { HostBadge } from "../components/primitives";
import { getVehicle, getProvider, isRangeFree } from "../services/rentalService";
import { formatCentavos, estimateCheckout } from "../utils/pricing";
import { getPricingConfig, overridesFor } from "../services/configService";

const HERO_W = Dimensions.get("window").width - 48;
const DAY = 864e5;

export default function VehicleDetailScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { vehicleId, eventId, eventTitle, startAt, endAt } = route.params || {};
  const [vehicle, setVehicle] = useState(null);
  const [provider, setProvider] = useState(null);
  const [cfg, setCfg] = useState(null);
  const [startDate, setStartDate] = useState(startAt ? new Date(startAt) : new Date());
  const [endDate, setEndDate] = useState(
    endAt ? new Date(endAt) : new Date(Date.now() + DAY)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const v = await getVehicle(vehicleId);
      setVehicle(v);
      if (v?.providerId) setProvider(await getProvider(v.providerId));
      getPricingConfig().then(setCfg);
      setLoading(false);
    })();
  }, [vehicleId]);

  const styles = createStyles(colors, isDark);

  if (loading) {
    return (
      <GradientBackground>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </GradientBackground>
    );
  }
  if (!vehicle) {
    return (
      <GradientBackground>
        <View style={styles.loading}>
          <Text style={{ color: colors.textSecondary }}>{t("vehicleDetail.notFound")}</Text>
        </View>
      </GradientBackground>
    );
  }

  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();
  const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / DAY));
  const feeBase = vehicle.pricePerDayCentavos * days;
  const isFree = feeBase === 0;
  const breakdown = isFree ? null : estimateCheckout(feeBase, "stripe", overridesFor(cfg, "rental"));
  const total = breakdown ? breakdown.totalCentavos : 0;
  const datesValid = endDate.getTime() > startDate.getTime();
  const available =
    vehicle.status === "available" && datesValid && isRangeFree(vehicle, startISO, endISO);

  const onRent = () => {
    navigation.navigate("RentalCheckout", {
      vehicle,
      days,
      startAt: startISO,
      endAt: endISO,
      eventId,
      eventTitle,
    });
  };

  return (
    <GradientBackground>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="back" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {vehicle.photos.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.hero}
          >
            {vehicle.photos.map((uri) => (
              <Image key={uri} source={{ uri }} style={styles.heroImg} />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.hero}>
            <Text style={[styles.heroPlaceholder, { color: colors.textTertiary }]}>{t("rentals.hub.noPhoto")}</Text>
          </View>
        )}

        <Text style={[styles.title, { color: colors.text }]}>{vehicle.title}</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          {vehicle.city ? `${vehicle.city} · ` : ""}{vehicle.pickupLabel || t("rentals.hub.pickupOnSite")}
        </Text>

        {provider && (
          <View style={styles.providerRow}>
            <Text style={[styles.provider, { color: colors.textSecondary }]}>
              {t("vehicleDetail.byProvider", { name: provider.name || t("vehicleDetail.partner") })}
            </Text>
            {provider.verified && <HostBadge small />}
          </View>
        )}

        <View style={[styles.specs, { borderColor: colors.border }]}>
          <Spec label={t("vehicleDetail.specType")} value={vehicle.type} colors={colors} />
          {vehicle.rangeKm ? (
            <Spec label={t("vehicleDetail.specRange")} value={t("vehicleDetail.rangeKm", { km: vehicle.rangeKm })} colors={colors} />
          ) : null}
          {vehicle.requiresLicense ? (
            <Spec label={t("rentals.hub.license")} value={t("vehicleDetail.required")} colors={colors} />
          ) : null}
          {vehicle.depositCentavos ? (
            <Spec label={t("vehicleDetail.depositToHost")} value={formatCentavos(vehicle.depositCentavos)} colors={colors} />
          ) : null}
        </View>

        {eventId && (
          <View style={[styles.eventBanner, { borderColor: colors.border }]}>
            <Text style={[styles.eventBannerText, { color: colors.textSecondary }]} numberOfLines={2}>
              {t("vehicleDetail.linkedToEventPrefix")}{" "}
              <Text style={{ color: colors.text, fontWeight: "700" }}>{eventTitle || t("rentals.common.yourEvent")}</Text>.
            </Text>
          </View>
        )}

        <Text style={[styles.datesTitle, { color: colors.text }]}>{t("vehicleDetail.availability")}</Text>
        <AvailabilityCalendar
          bookedRanges={vehicle.bookedRanges}
          availableFrom={vehicle.availableFrom}
          availableUntil={vehicle.availableUntil}
          selectedStart={startDate}
          selectedEnd={endDate}
        />

        <Text style={[styles.datesTitle, { color: colors.text }]}>{t("vehicleDetail.chooseDates")}</Text>
        <View style={styles.datesRow}>
          <DateField
            label={t("rentals.activeRental.from")}
            value={startDate}
            onChange={(d) => {
              setStartDate(d);
              if (endDate.getTime() <= d.getTime()) setEndDate(new Date(d.getTime() + DAY));
            }}
            minimumDate={new Date()}
          />
          <DateField
            label={t("rentals.activeRental.until")}
            value={endDate}
            onChange={setEndDate}
            minimumDate={new Date(startDate.getTime() + DAY)}
          />
        </View>
        {!available && (
          <Text style={[styles.unavailable, { color: "#EF4444" }]}>
            {vehicle.status !== "available"
              ? t("vehicleDetail.notAvailableNow")
              : t("vehicleDetail.notAvailableDates")}
          </Text>
        )}

        {!isFree && breakdown && (
          <View style={[styles.feeBox, { borderColor: colors.border }]}>
            <FeeRow label={t("vehicleDetail.rentalDaysLabel", { count: days })} value={formatCentavos(feeBase)} colors={colors} />
            <FeeRow label={t("rentals.checkout.serviceFee")} value={formatCentavos(breakdown.platformFeeCentavos)} colors={colors} />
            <FeeRow label={t("rentals.checkout.processingFee")} value={formatCentavos(breakdown.stripeFeeCentavos)} colors={colors} />
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderColor: colors.border, backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.footerPrice, { color: colors.text }]}>
            {isFree ? t("rentals.common.free") : formatCentavos(total)}
          </Text>
          <Text style={[styles.footerUnit, { color: colors.textTertiary }]}>
            {isFree ? t("vehicleDetail.noCharge") : t("vehicleDetail.daysInclFees", { count: days })}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.rentBtn, { backgroundColor: available ? colors.primary : colors.border, opacity: available ? 1 : 0.6 }]}
          onPress={onRent}
          disabled={!available}
          activeOpacity={0.85}
        >
          <Text style={styles.rentTxt}>{available ? t("vehicleDetail.rentNow") : t("vehicleDetail.notAvailable")}</Text>
        </TouchableOpacity>
      </View>
    </GradientBackground>
  );
}

function FeeRow({ label, value, colors }) {
  return (
    <View style={feeStyles.row}>
      <Text style={[feeStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[feeStyles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const feeStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: "600" },
});

function Spec({ label, value, colors }) {
  return (
    <View style={specStyles.spec}>
      <Text style={[specStyles.specLabel, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[specStyles.specValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const specStyles = StyleSheet.create({
  spec: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  specLabel: { fontSize: 14 },
  specValue: { fontSize: 14, fontWeight: "700", textTransform: "capitalize" },
});

function createStyles(colors, isDark) {
  return StyleSheet.create({
    loading: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 4 },
    content: { paddingHorizontal: 24, paddingBottom: 140 },
    hero: {
      height: 200, borderRadius: 20, marginBottom: 18, overflow: "hidden",
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
      alignItems: "center", justifyContent: "center",
    },
    heroImg: { width: HERO_W, height: 200, borderRadius: 20 },
    heroPlaceholder: { fontSize: 13, fontWeight: "600" },
    title: { fontSize: 24, fontWeight: "800" },
    sub: { fontSize: 15, marginTop: 4 },
    providerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
    provider: { fontSize: 14 },
    specs: { borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 20 },
    eventBanner: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 16 },
    eventBannerText: { fontSize: 13, lineHeight: 18 },
    datesTitle: { fontSize: 16, fontWeight: "800", marginTop: 24, marginBottom: 12 },
    datesRow: { flexDirection: "row", gap: 12 },
    unavailable: { fontSize: 13, fontWeight: "600", marginTop: 12 },
    feeBox: { borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 20 },
    footer: {
      position: "absolute", bottom: 0, left: 0, right: 0,
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 24, paddingTop: 16, paddingBottom: 34,
      borderTopWidth: 1,
    },
    footerPrice: { fontSize: 20, fontWeight: "800" },
    footerUnit: { fontSize: 12, marginTop: 2 },
    rentBtn: { borderRadius: 26, paddingVertical: 15, paddingHorizontal: 32 },
    rentTxt: { color: "#fff", fontSize: 16, fontWeight: "800" },
  });
}
