from django.core.management.base import BaseCommand
from triage.models import TriageSession

class Command(BaseCommand):
    help = 'Backfill empty district fields with test districts for demonstration'

    def add_arguments(self, parser):
        parser.add_argument(
            '--district',
            type=str,
            default='Kathmandu',
            help='District name to assign to empty records (default: Kathmandu)',
        )

    def handle(self, *args, **options):
        district = options['district']
        
        # Find sessions with empty or null district
        empty_sessions = TriageSession.objects.filter(
            district__in=['', None]
        )
        count = empty_sessions.count()
        
        if count == 0:
            self.stdout.write(self.style.WARNING('No sessions with empty districts found.'))
            return
        
        # Update them with the test district
        empty_sessions.update(district=district)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Successfully backfilled {count} consultation(s) with district "{district}"'
            )
        )
        
        # Show updated stats
        all_sessions = TriageSession.objects.all()
        self.stdout.write(f'\n📊 Total sessions: {all_sessions.count()}')
        
        # Group by district
        districts = {}
        for session in all_sessions:
            d = session.district or 'Unknown'
            districts[d] = districts.get(d, 0) + 1
        
        self.stdout.write('\nDistrict breakdown:')
        for dist, count in sorted(districts.items(), key=lambda x: x[1], reverse=True):
            self.stdout.write(f'  • {dist}: {count}')
