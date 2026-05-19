# Gradle Patches

যদি build fail করে "Duplicate class kotlin" error দেখায়, তাহলে:

EAS dashboard → Build settings → এই environment variable যোগ করো:
- Name: `GRADLE_OPTS`  
- Value: `-Dorg.gradle.jvmargs=-Xmx4096m -Dkotlin.stdlib.jdk8.enabled=false`

অথবা expo.dev → Project → Environment Variables এ যোগ করো।
