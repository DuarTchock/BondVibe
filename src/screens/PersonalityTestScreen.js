import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useTheme } from '../contexts/ThemeContext';

const QUESTIONS = [
  {
    id: 1,
    trait: 'openness',
    question: 'I enjoy trying new experiences',
    options: [
      { label: 'Strongly Disagree', value: 20 },
      { label: 'Disagree', value: 40 },
      { label: 'Neutral', value: 60 },
      { label: 'Agree', value: 80 },
      { label: 'Strongly Agree', value: 100 },
    ]
  },
  {
    id: 2,
    trait: 'conscientiousness',
    question: 'I am always prepared and organized',
    options: [
      { label: 'Strongly Disagree', value: 20 },
      { label: 'Disagree', value: 40 },
      { label: 'Neutral', value: 60 },
      { label: 'Agree', value: 80 },
      { label: 'Strongly Agree', value: 100 },
    ]
  },
  {
    id: 3,
    trait: 'extraversion',
    question: 'I enjoy being around people',
    options: [
      { label: 'Strongly Disagree', value: 20 },
      { label: 'Disagree', value: 40 },
      { label: 'Neutral', value: 60 },
      { label: 'Agree', value: 80 },
      { label: 'Strongly Agree', value: 100 },
    ]
  },
  {
    id: 4,
    trait: 'agreeableness',
    question: 'I am compassionate and cooperative',
    options: [
      { label: 'Strongly Disagree', value: 20 },
      { label: 'Disagree', value: 40 },
      { label: 'Neutral', value: 60 },
      { label: 'Agree', value: 80 },
      { label: 'Strongly Agree', value: 100 },
    ]
  },
  {
    id: 5,
    trait: 'neuroticism',
    question: 'I tend to worry about things',
    options: [
      { label: 'Strongly Disagree', value: 20 },
      { label: 'Disagree', value: 40 },
      { label: 'Neutral', value: 60 },
      { label: 'Agree', value: 80 },
      { label: 'Strongly Agree', value: 100 },
    ]
  },
];

export default function PersonalityTestScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);

  const handleAnswer = (value) => {
    const question = QUESTIONS[currentQuestion];
    const newAnswers = {
      ...answers,
      [question.trait]: value
    };
    setAnswers(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishTest(newAnswers);
    }
  };

  const finishTest = async (finalAnswers) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        personality: finalAnswers,
        onboardingComplete: true,
        updatedAt: new Date().toISOString(),
      });
      // Navigation will be handled by App.js auth listener
    } catch (error) {
      console.error('Error saving personality:', error);
      Alert.alert('Error', 'Failed to save your results');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    Alert.alert(
      'Skip Test?',
      'You can complete this later in your profile',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                onboardingComplete: true,
              });
            } catch (error) {
              console.error('Error skipping test:', error);
            }
          }
        }
      ]
    );
  };

  const styles = createStyles(colors);
  const question = QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerText, { color: colors.textSecondary }]}>
            Question {currentQuestion + 1} of {QUESTIONS.length}
          </Text>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={[styles.skipButton, { color: colors.primary }]}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressContainer, { backgroundColor: colors.border }]}>
          <View style={[styles.progressBar, {
            width: `${progress}%`,
            backgroundColor: colors.primary
          }]} />
        </View>

        {/* Question */}
        <View style={styles.questionSection}>
          <Text style={styles.questionEmoji}>🎯</Text>
          <Text style={[styles.questionText, { color: colors.text }]}>
            {question.question}
          </Text>
        </View>

        {/* Options */}
        <View style={styles.optionsSection}>
          {question.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionButton}
              onPress={() => handleAnswer(option.value)}
              activeOpacity={0.8}
            >
              <View style={[styles.optionGlass, {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border
              }]}>
                <Text style={[styles.optionText, { color: colors.text }]}>
                  {option.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <View style={[styles.infoGlass, {
            backgroundColor: `${colors.secondary}1A`,
            borderColor: `${colors.secondary}33`
          }]}>
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              We use the Big Five personality model to help match you with compatible groups
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 32,
      paddingTop: 80,
      paddingBottom: 40,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    headerText: {
      fontSize: 14,
      fontWeight: '600',
    },
    skipButton: {
      fontSize: 15,
      fontWeight: '600',
    },
    progressContainer: {
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 40,
    },
    progressBar: {
      height: '100%',
      borderRadius: 3,
    },
    questionSection: {
      alignItems: 'center',
      marginBottom: 40,
    },
    questionEmoji: {
      fontSize: 56,
      marginBottom: 20,
    },
    questionText: {
      fontSize: 24,
      fontWeight: '700',
      textAlign: 'center',
      lineHeight: 32,
      letterSpacing: -0.5,
    },
    optionsSection: {
      gap: 12,
      marginBottom: 32,
    },
    optionButton: {
      borderRadius: 16,
      overflow: 'hidden',
    },
    optionGlass: {
      borderWidth: 1,
      paddingVertical: 18,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    optionText: {
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    infoCard: {
      borderRadius: 16,
      overflow: 'hidden',
    },
    infoGlass: {
      borderWidth: 1,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    infoIcon: {
      fontSize: 24,
      marginRight: 12,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 20,
    },
  });
}
