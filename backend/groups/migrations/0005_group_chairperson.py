import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Add nullable `chairperson` FK to the Group model.
    """

    dependencies = [
        ('groups', '0004_cycle_max_loan_percentage'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='group',
            name='chairperson',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='chaired_groups',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
